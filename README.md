# PaperMind.ai  

PaperMind.ai is a secure full-stack AI platform that processes complex legal documents and delivers human-friendly explanations powered by a multi-agent analytical workflow.  

## Features  
- **Secure Authentication**  
  - Built with Passport.js and Google OAuth 2.0 for reliable user authentication and authorization.  
- **AI-Powered Legal Insights**  
  - Orchestrates three specialized AI sub-agents for deep legal analysis:  
    1. **RAG Summarizer with Law Matching** → Summarizes documents and matches clauses with relevant laws.  
    2. **Risk Analysis Agent** → Detects potential legal risks, ambiguities, or compliance gaps.  
    3. **Legal Dictionary Agent** → Provides plain-language explanations of legal jargon and terms.  
- **Interactive Visualizations**  
  - Uses Google-ADK to render insights in a clear, interactive format for better understanding.  
- **Data Collection Tools**  
  - Integrates a web crawler and external data sources to enrich legal interpretations with up-to-date references.  

## Tech Stack  
- **Frontend**: React  
- **Backend**: Node.js + Express  
- **AI & Data Processing**: Python (multi-agent orchestration, NLP, RAG models)  
- **Authentication**: Passport.js + Google OAuth 2.0  
- **Visualization**: Google-ADK, custom data pipelines  

## Workflow Overview  
1. User uploads or inputs a legal document.  
2. Platform authenticates and securely processes the file.  
3. AI orchestration pipeline triggers the three sub-agents.  
4. Outputs:  
   - Summarized content with law-matching highlights  
   - Risk analysis report  
   - Dictionary-style explanations of legal terminology  
   - Interactive visualizations for exploration  

## Security  
- OAuth 2.0 for secure user access.  
- Document data encrypted in transit and at rest.  
- Role-based access control for enterprise use.  

## Roadmap  
- [ ] Add multilingual legal document support  
- [ ] Expand visualization modules  
- [-] Enhance web crawler for broader legal jurisdictions  
- [ ] Support contract drafting suggestions  

## License  
MIT License © 2025 PaperMind.ai Team  
