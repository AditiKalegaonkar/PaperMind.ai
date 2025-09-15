import React, { useEffect, useState } from "react";
import "./About.css";
import { Typewriter } from "react-simple-typewriter";
import Navbar from "./Navbar.jsx";
import Mascot from "./assets/turtle-3.png";
import Codesnip from "./assets/Code Snippet.png";
import Dashboardsnip from "./assets/Dashboard snippet.jpg";
import legal from "./assets/legaldocs.png";
import edu from "./assets/edudoc.png";
import finance from "./assets/financialdocs.png";
import other from "./assets/other.png";

function About() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const blocks = document.querySelectorAll(".domain-blocks");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.3 }
    );
    blocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, []);

  const domains = [
    {
      img: legal,
      title: "Legal Docs",
      desc: "Analyzes contracts, regulations, and legal obligations. Maps breaches to potential lawsuits and highlights jurisdiction-specific risks.",
    },
    {
      img: edu,
      title: "Educational Docs",
      desc: "Helps students and educators interpret academic policies, plagiarism rules, and curriculum guidelines. Ensures academic integrity.",
    },
    {
      img: finance,
      title: "Financial Docs",
      desc: "Processes banking policies, insurance terms, and financial regulations. Detects compliance gaps and supports decision-making.",
    },
    {
      img: other,
      title: "Other Docs",
      desc: "Handles miscellaneous documents across domains. Offers semantic search, summarization, and citation-based answers.",
    },
  ];

  const features = [
    {
      img: Codesnip,
      desc: "PaperMind.ai's backend orchestrates intelligent query routing, advanced document parsing, and multi-agent coordination to deliver precise, domain-specific responses.",
    },
    {
      img: Dashboardsnip,
      desc: "The PaperMind.ai dashboard provides an intuitive interface where users can upload documents, ask complex queries, and receive AI-generated insights in real-time.",
    },
  ];

  return (
    <>
      <div className="main-head quicksand">
        <Navbar />
        <div className="hero-content">
          <div className="mascot">
            <img src={Mascot} alt="PaperMind Mascot" />
          </div>
          <div className="description">
            <h1 className="headline">
              <Typewriter
                words={["PaperMind.ai"]}
                loop={false}
                cursor={!done ? "|" : ""}
                typeSpeed={450}
                deleteSpeed={0}
                delaySpeed={1000}
                onLoopDone={() => setDone(true)}
              />
            </h1>
            <p>
              PaperMind.ai is a cutting-edge document intelligence platform
              designed to transform complex PDFs, scanned text, and dense policy
              manuals into clear, actionable knowledge. By combining
              Retrieval-Augmented Generation (RAG) with specialized domain
              agents, it enables professionals to interact with documents as if
              they were having a real-time conversation with an expert.
            </p>
            <p>
              Whether you're reviewing a 200-page contract, interpreting
              educational guidelines, or navigating the fine print of insurance
              policies, PaperMind.ai helps break down complexity into digestible
              insights. Its multi-agent orchestration detects compliance gaps,
              summarizes policies, and provides jurisdiction-aware
              recommendations.
            </p>
            <p>
              Built for legal, financial, academic, and enterprise contexts,
              PaperMind.ai saves time, reduces errors, and ensures decision-makers
              focus on strategy rather than paperwork.
            </p>
          </div>
        </div>
      </div>

      <div className="domain quicksand">
        {domains.map((d, i) => (
          <div className="domain-blocks" key={i}>
            <div className="domain-blocks-head">
              <img src={d.img} alt={d.title} />
              <h4>{d.title}</h4>
            </div>
            <p>{d.desc}</p>
          </div>
        ))}
      </div>

      <div className="extra-info quicksand">
        <h2>Featured</h2>
        {features.map((f, i) => (
          <div className="extra-blocks" key={i}>
            <img src={f.img} alt="Feature" />
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="end quicksand">
        <p>© All Rights Reserved By PaperMind.ai 2025</p>
      </div>
    </>
  );
}

export default About;