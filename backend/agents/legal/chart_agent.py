from google.adk.agents import Agent
from google.adk.tools.agent_tool import AgentTool
from google.genai import types

chart_data_agent = Agent(
    name="chart_data_agent",
    model="gemini-2.0-flash",
    description="Extracts structured chart data from a legal risk analysis summary.",
    instruction="""
    You are a data extraction agent. Your ONLY job is to read a legal risk analysis
    and return a single valid JSON object. 

    STRICT RULES:
    - Output ONLY raw JSON. No markdown, no backticks, no explanation, no preamble.
    - Do NOT write ```json or ``` anywhere.
    - The JSON must follow this exact schema:

    {
      "severity": [
        { "label": "High",   "count": <integer> },
        { "label": "Medium", "count": <integer> },
        { "label": "Low",    "count": <integer> }
      ],
      "categories": [
        { "label": "Contract",            "count": <integer> },
        { "label": "Financial",           "count": <integer> },
        { "label": "Compliance",          "count": <integer> },
        { "label": "Privacy",             "count": <integer> },
        { "label": "Litigation",          "count": <integer> }
      ],
      "top_risks": [
        { "title": "<short risk title>", "severity": "High"|"Medium"|"Low", "clause": "<clause reference>" }
      ]
    }

    Count rules:
    - severity.count  → number of distinct risks at that severity level
    - categories.count → number of risks belonging to that legal category
    - top_risks → max 5 items, only High or Medium severity
    - If a category has 0 risks, still include it with count: 0
    - Infer counts carefully from the analysis text; do not hallucinate.
    """,
    generate_content_config=types.GenerateContentConfig(
          temperature=0.3,
          max_output_tokens=2048,   
          top_p=0.95,
      ),
    tools=[]
)

chart_data_agent_tool = AgentTool(chart_data_agent)