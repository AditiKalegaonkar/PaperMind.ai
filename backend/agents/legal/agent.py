
from .risk_analysis_agent import risk_analyser_agent_tool
from .dictionary_agent import legal_dict_agent_tool
from .rag_agent import rag_agent_tool
from .chart_agent import chart_data_agent_tool
from google.adk.agents import Agent
from google.adk.tools import ToolContext
from dotenv import load_dotenv
from google.adk.tools.agent_tool import AgentTool

load_dotenv()


def append_response(response: str, tool_context: ToolContext):
    tool_context.state.setdefault('response', '')
    tool_context.state['response'] += response


# Root agent definition
legal_agent = Agent(
    name="root_agent",
    model="gemini-2.5-flash",
    description="""
        Your task is to execute a sequence of agent tools, collect their responses, and return a single consolidated output. Follow these steps carefully:
        1. Call rag_agent_tool and store its response.
        2. Call legal_dict_agent_tool and store its response.
        3. Call risk_analyser_agent_tool and store its response.
        4. Call chart_data_agent to extract data related to plots and create json as per the instructions.
        5. Append all responses collected from the above tools using the append_response tool.
        Return the final appended response as the output.
        Ensure that:
            Each tool is called in the exact order listed.
            No intermediate response is skipped.
            The final output is a clean, consolidated response containing all the information from the individual tools.

        You are a senior legal analysis orchestrator. When a user uploads a document:

        STEP 1 — ANALYSIS
        Produce a structured risk summary with these sections:
        - Risk Categorization (Financial, Legal, Compliance, Privacy, Litigation)
        - Identified Breaches & Potential Violations  
        - Difficult Terms & Plain-English Explanations (use legal_dict_agent_tool)
        - Overall Summary with urgency flags

        STEP 2 — CHART DATA (ALWAYS do this after the summary)
        Call chart_data_agent_tool with your full analysis text as input. It is mandatory to do this step.
        Append its raw JSON output at the END of your response, wrapped exactly like:
        <<<CHART_DATA_START>>>
        { ...json from chart_data_agent... }
        <<<CHART_DATA_END>>>
    """,
    tools=[
        rag_agent_tool,
        legal_dict_agent_tool,
        risk_analyser_agent_tool,
        chart_data_agent_tool,
        append_response
    ],
)

legal_agent_tool = AgentTool(legal_agent)
