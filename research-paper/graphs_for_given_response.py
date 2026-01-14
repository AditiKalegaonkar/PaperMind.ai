"""
Response from LLM: 

LEGAL NDA ANSWER:
The Receiving Party shall promptly notify the Disclosing Party of any legal request for disclosure of Confidential Information and co-operate to challenge or limit its scope. It must return/destroy Confidential Information upon written request, certify compliance, and indemnify the Disclosing Party for any agreement violations. The Receiving Party may not copy, reproduce, or use the Disclosing Party’s name/trademarks without prior written consent.
LEGAL NDA METRICS:
{'retrieval': {'hit_rate': 0, 'mrr': 0, 'precision': 0.0, 'recall': 0.0, 'f1': 0}, 'generation': {'bleu': 0.02389322649669771, 'readability': 8.471236559139811}, 'end_to_end': {'groundedness': 0.8695652173913043, 'hallucination_rate': 0.13043478260869565}}

LEGAL RENT ANSWER:
Landlord remedies include Lease termination, Eviction filing, Claiming damages, and Withholding security deposit.
LEGAL RENT METRICS:
{'retrieval': {'hit_rate': 1, 'mrr': 0, 'precision': 0.2, 'recall': 0.5, 'f1': 0.28571428571428575}, 'generation': {'bleu': 0.01904256299600657, 'readability': -21.11384615384611}, 'end_to_end': {'groundedness': 1.0, 'hallucination_rate': 0.0}}

FINANCE ANSWER:
The total net portfolio value at the end of the statement period is $1,483,680.50.
FINANCE METRICS:
{'retrieval': {'hit_rate': 1, 'mrr': 0, 'precision': 0.2, 'recall': 0.3333333333333333, 'f1': 0.25}, 'generation': {'bleu': 1.0, 'readability': 59.68214285714288}, 'end_to_end': {'groundedness': 0.8571428571428571, 'hallucination_rate': 0.14285714285714285}}

EDUCATION ANSWER:
AI guardrails are necessary because without them, LLMs can be unpredictable due to toxicity, bias, and falsehoods from their training data. They are essential for safety, ethics, data privacy, brand reputation, and topic adherence, enabling confident deployment.
EDUCATION METRICS:
{'retrieval': {'hit_rate': 0, 'mrr': 0, 'precision': 0.0, 'recall': 0.0, 'f1': 0}, 'generation': {'bleu': 0.087593103737711, 'readability': 18.857500000000016}, 'end_to_end': {'groundedness': 0.7777777777777778, 'hallucination_rate': 0.2222222222222222}}

MISC NDA ANSWER:
The NDA manages confidentiality risks by requiring the Receiving Party to refrain from disclosing or distributing Confidential Information except for the Proposed Transaction. Parties must protect each other's Confidential Information with the same care as their own, and in case of legally required disclosure, the Receiving Party must provide notice and cooperate to limit its scope.
MISC NDA METRICS:
{'retrieval': {'hit_rate': 0, 'mrr': 0, 'precision': 0.0, 'recall': 0.0, 'f1': 0}, 'generation': {'bleu': 0.09663075814603383, 'readability': 12.236428571428604}, 'end_to_end': {'groundedness': 0.8125, 'hallucination_rate': 0.1875}}

MISC RENT ANSWER:
Tenant is prohibited from unauthorized repairs, alterations, painting, installing fixtures, drilling, modifying electrical lines, or changing locks.
Tenant is responsible for utilities, timely rent payments, must follow society rules, avoid disturbing neighbors and illegal activities.    
Tenant indemnifies the Landlord against injuries due to negligence, legal claims from misuse, and damages by guests.
MISC RENT METRICS:
{'retrieval': {'hit_rate': 1, 'mrr': 0, 'precision': 0.1, 'recall': 0.25, 'f1': 0.14285714285714288}, 'generation': {'bleu': 0.007975906535156233, 'readability': 8.653205128205144}, 'end_to_end': {'groundedness': 0.7959183673469388, 'hallucination_rate': 0.20408163265306123}}    

MISC FINANCE ANSWER:
The statement includes a disclaimer that "Past performance is not indicative of future results." It also states that the listed securities and prices "do not represent real-time data or investment advice."
MISC FINANCE METRICS:
{'retrieval': {'hit_rate': 1, 'mrr': 0, 'precision': 0.4, 'recall': 0.5, 'f1': 0.4444444444444445}, 'generation': {'bleu': 0.052454471410701885, 'readability': 38.27669354838713}, 'end_to_end': {'groundedness': 0.7741935483870968, 'hallucination_rate': 0.22580645161290322}}      

MISC EDUCATION ANSWER:
AI guardrails reduce operational risks by ensuring systems operate within intended boundaries, preventing off-topic responses and hallucinations, thus enhancing reliability. They reduce ethical risks by preventing harmful content generation, ensuring data privacy, and safeguarding brand reputation.
MISC EDUCATION METRICS:
{'retrieval': {'hit_rate': 0, 'mrr': 0, 'precision': 0.0, 'recall': 0.0, 'f1': 0}, 'generation': {'bleu': 0.10406104960841618, 'readability': -15.884999999999962}, 'end_to_end': {'groundedness': 0.8125, 'hallucination_rate': 0.1875}}

"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator, FormatStrFormatter

# ---------------- FONT SETTINGS ----------------
TITLE_FONTSIZE = 20
LABEL_FONTSIZE = 16
TICK_FONTSIZE = 14
LEGEND_FONTSIZE = 14
VALUE_FONTSIZE = 16

# ---------------- COLOR PALETTE (NO BLUE) ----------------
SINGLE_COLORS = ["#E67E22", "#27AE60", "#8E44AD"]
COMPARE_COLORS = ["#E67E22", "#27AE60"]

# ---------------- DATA ----------------
LEGAL_NDA_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.0239, "readability": 8.47},
    "end_to_end": {"groundedness": 0.87, "hallucination_rate": 0.13}
}

LEGAL_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.2, "recall": 0.5, "f1": 0.29},
    "generation": {"bleu": 0.019, "readability": -21.11},
    "end_to_end": {"groundedness": 1.0, "hallucination_rate": 0.0}
}

FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.2, "recall": 0.33, "f1": 0.25},
    "generation": {"bleu": 1.0, "readability": 59.68},
    "end_to_end": {"groundedness": 0.86, "hallucination_rate": 0.14}
}

EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.088, "readability": 18.86},
    "end_to_end": {"groundedness": 0.78, "hallucination_rate": 0.22}
}

MISC_NDA_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.097, "readability": 12.24},
    "end_to_end": {"groundedness": 0.81, "hallucination_rate": 0.19}
}

MISC_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.1, "recall": 0.25, "f1": 0.14},
    "generation": {"bleu": 0.008, "readability": 8.65},
    "end_to_end": {"groundedness": 0.80, "hallucination_rate": 0.20}
}

MISC_FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.4, "recall": 0.5, "f1": 0.44},
    "generation": {"bleu": 0.052, "readability": 38.28},
    "end_to_end": {"groundedness": 0.77, "hallucination_rate": 0.23}
}

MISC_EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.104, "readability": -15.89},
    "end_to_end": {"groundedness": 0.81, "hallucination_rate": 0.19}
}

# ---------------- HELPERS ----------------


def to_lists(metrics):
    labels, values, groups = [], [], []
    for c in metrics:
        for m, v in metrics[c].items():
            labels.append(m)
            values.append(v)
            groups.append(c)
    return labels, values, groups

# ---------------- SINGLE DATASET PLOT ----------------


def plot_single(metrics, title, filename):
    labels, values, groups = to_lists(metrics)

    x = np.arange(len(labels)) * 1.5
    width = 0.22
    offsets = [-width, 0, width]

    group_set = list(sorted(set(groups)))

    plt.figure(figsize=(17, 8))

    for i, g in enumerate(group_set):
        idx = [j for j, grp in enumerate(groups) if grp == g]

        bars = plt.bar(x[idx] + offsets[i],
                       [values[j] for j in idx],
                       width,
                       label=g.replace("_", " ").title(),
                       color=SINGLE_COLORS[i],
                       edgecolor="black")

        for k, bar in enumerate(bars):
            h = bar.get_height()
            offset = 0.05 + (k % 3) * 0.08
            plt.text(bar.get_x() + bar.get_width()/2,
                     h + offset,
                     f"{h:.2f}",
                     ha="center", va="bottom",
                     fontsize=VALUE_FONTSIZE)

    plt.xticks(x, labels, rotation=30, ha="right", fontsize=TICK_FONTSIZE)
    plt.yticks(fontsize=TICK_FONTSIZE)

    ax = plt.gca()
    ax.yaxis.set_major_locator(MaxNLocator(5))
    ax.yaxis.set_major_formatter(FormatStrFormatter('%.2f'))

    plt.title(title, fontsize=TITLE_FONTSIZE)
    plt.xlabel("Metrics", fontsize=LABEL_FONTSIZE)
    plt.ylabel("Score", fontsize=LABEL_FONTSIZE)
    plt.legend(fontsize=LEGEND_FONTSIZE)
    plt.grid(axis="y", linestyle="--", alpha=0.7)

    plt.ylim(bottom=0)
    plt.tight_layout()
    plt.savefig(filename, dpi=300)
    plt.close()


def plot_compare(m1, m2, n1, n2, title, filename):
    labels, v1, v2 = [], [], []

    for c in m1:
        for m in m1[c]:
            labels.append(m)
            v1.append(m1[c][m])
            v2.append(m2[c].get(m, 0))

    x = np.arange(len(labels)) * 1.6
    width = 0.30

    plt.figure(figsize=(18, 8))

    bars1 = plt.bar(x - width/2, v1, width,
                    label=n1, color=COMPARE_COLORS[0], edgecolor="black")
    bars2 = plt.bar(x + width/2, v2, width,
                    label=n2, color=COMPARE_COLORS[1], edgecolor="black")

    # ---- PER-METRIC COLLISION FREE LABEL PLACEMENT ----
    for i in range(len(labels)):
        b1 = bars1[i]
        b2 = bars2[i]

        h1 = b1.get_height()
        h2 = b2.get_height()

        # base offsets
        off1 = 0.6
        off2 = 0.6

        # if close, separate vertically
        if abs(h1 - h2) < 1.0:
            off2 = 1.8

        # label 1
        y1 = h1 + off1 if h1 >= 0 else h1 - off1
        plt.text(b1.get_x() + b1.get_width()/2, y1,
                 f"{h1:.2f}", ha="center",
                 va="bottom" if h1 >= 0 else "top",
                 fontsize=VALUE_FONTSIZE)

        # label 2
        y2 = h2 + off2 if h2 >= 0 else h2 - off2
        plt.text(b2.get_x() + b2.get_width()/2, y2,
                 f"{h2:.2f}", ha="center",
                 va="bottom" if h2 >= 0 else "top",
                 fontsize=VALUE_FONTSIZE)

    plt.xticks(x, labels, rotation=30, ha="right", fontsize=TICK_FONTSIZE)
    plt.yticks(fontsize=TICK_FONTSIZE)

    ax = plt.gca()
    ax.yaxis.set_major_locator(MaxNLocator(6))
    ax.yaxis.set_major_formatter(FormatStrFormatter('%.2f'))

    plt.title(title, fontsize=TITLE_FONTSIZE)
    plt.xlabel("Metrics", fontsize=LABEL_FONTSIZE)
    plt.ylabel("Score", fontsize=LABEL_FONTSIZE)
    plt.legend(fontsize=LEGEND_FONTSIZE)
    plt.grid(axis="y", linestyle="--", alpha=0.7)

    ymin = min(v1 + v2) - 3
    ymax = max(v1 + v2) + 3
    plt.ylim(ymin, ymax)

    plt.tight_layout()
    plt.savefig(filename, dpi=300)
    plt.close()


# ---------------- GENERATE ALL SINGLE GRAPHS ----------------
plot_single(LEGAL_NDA_METRICS, "Legal NDA Metrics", "Legal_NDA_metrics.png")
plot_single(LEGAL_RENT_METRICS, "Legal Rent Metrics", "Legal_Rent_metrics.png")
plot_single(FINANCE_METRICS, "Finance Metrics", "Finance_metrics.png")
plot_single(EDUCATION_METRICS, "Education Metrics", "Education_metrics.png")
plot_single(MISC_NDA_METRICS, "Misc NDA Metrics", "Misc_NDA_metrics.png")
plot_single(MISC_RENT_METRICS, "Misc Rent Metrics", "Misc_Rent_metrics.png")
plot_single(MISC_FINANCE_METRICS, "Misc Finance Metrics",
            "Misc_Finance_metrics.png")
plot_single(MISC_EDUCATION_METRICS, "Misc Education Metrics",
            "Misc_Education_metrics.png")

# ---------------- GENERATE COMPARISON GRAPHS ----------------
plot_compare(LEGAL_NDA_METRICS, MISC_NDA_METRICS,
             "Legal NDA", "Misc NDA",
             "NDA Comparison", "NDA_comparison.png")

plot_compare(LEGAL_RENT_METRICS, MISC_RENT_METRICS,
             "Legal Rent", "Misc Rent",
             "Rent Comparison", "Rent_comparison.png")

plot_compare(FINANCE_METRICS, MISC_FINANCE_METRICS,
             "Finance", "Misc Finance",
             "Finance Comparison", "Finance_comparison.png")

plot_compare(EDUCATION_METRICS, MISC_EDUCATION_METRICS,
             "Education", "Misc Education",
             "Education Comparison", "Education_comparison.png")
