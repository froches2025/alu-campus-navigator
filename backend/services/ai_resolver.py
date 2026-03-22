"""AI-powered natural language to node_id resolution using Claude."""
import json
import os
import anthropic


def resolve_query(query: str, nodes: list[dict]) -> dict:
    nodes_context = "\n".join(
        "- {id}: {name}{aliases}".format(
            id=n["id"],
            name=n["name"],
            aliases=(
                f" (also known as: {', '.join(n['aliases'])})"
                if n.get("aliases")
                else ""
            ),
        )
        for n in nodes
    )

    # Inject examples directly into the user message for stronger adherence
    user_message = f"""Query: "{query}"

Available locations at ALU Social Commons:
{nodes_context}

Instructions:
- Match the query to the most relevant location above
- Prefer ground floor (nodes with SC-G-) when floor is not specified
- Respond with ONLY a JSON object, no other text, no markdown
- Format: {{"node_id": "SC-G-FOODCOURT", "confidence": "high"}}
- Use "high" if confident, "medium" if partially confident, "low" only if query is gibberish or completely unrelated to a campus building
- "where can i eat" = SC-G-FOODCOURT high
- "quiet spot" or "online class" = SC-1-POD-1 high
- "pray" = SC-G-PRAYER high
- "pool table" or "games" = SC-1-GAMES high"""

    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
        messages=[{"role": "user", "content": user_message}],
    )

    raw = next((b.text for b in response.content if b.type == "text"), "{}")
    raw = raw.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return {"node_id": None, "confidence": "low"}

    node_id = result.get("node_id")
    confidence = result.get("confidence", "low")

    if confidence == "low" or not node_id:
        return {"node_id": None, "confidence": confidence}

    return {"node_id": node_id, "confidence": confidence}