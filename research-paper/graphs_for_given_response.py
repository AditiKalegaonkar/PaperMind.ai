"""
Response from LLM:

LEGAL NDA ANSWER:
The Receiving Party shall promptly notify the Disclosing Party of any legal request for
disclosure of Confidential Information and co-operate to challenge or limit its scope.
It must return/destroy Confidential Information upon written request, certify compliance,
and indemnify the Disclosing Party for any agreement violations. The Receiving Party may
not copy, reproduce, or use the Disclosing Party’s name/trademarks without prior written
consent.

LEGAL NDA METRICS:
{'retrieval': {'hit_rate': 0, 'mrr': 0, 'precision': 0.0, 'recall': 0.0, 'f1': 0},
 'generation': {'bleu': 0.02389322649669771, 'readability': 8.471236559139811},
 'end_to_end': {'groundedness': 0.8695652173913043,
                'hallucination_rate': 0.13043478260869565}}

LEGAL RENT ANSWER:
Landlord remedies include Lease termination, Eviction filing, Claiming damages,
and Withholding security deposit.

FINANCE ANSWER:
The total net portfolio value at the end of the statement period is $1,483,680.50.
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
    "retrieval": {"hit_rate": 0, "mrr": 0},
    "generation": {"bleu": 0.0239, "readability": 8.47},
    "end_to_end": {"groundedness": 0.87, "hallucination_rate": 0.13}
}

LEGAL_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0},
    "generation": {"bleu": 0.019, "readability": -21.11},
    "end_to_end": {"groundedness": 1.0, "hallucination_rate": 0.0}
}

FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0},
    "generation": {"bleu": 1.0, "readability": 59.68},
    "end_to_end": {"groundedness": 0.86, "hallucination_rate": 0.14}
}

EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0},
    "generation": {"bleu": 0.088, "readability": 18.86},
    "end_to_end": {"groundedness": 0.78, "hallucination_rate": 0.22}
}

MISC_NDA_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0},
    "generation": {"bleu": 0.097, "readability": 12.24},
    "end_to_end": {"groundedness": 0.81, "hallucination_rate": 0.19}
}

MISC_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0},
    "generation": {"bleu": 0.008, "readability": 8.65},
    "end_to_end": {"groundedness": 0.80, "hallucination_rate": 0.20}
}

MISC_FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0},
    "generation": {"bleu": 0.052, "readability": 38.28},
    "end_to_end": {"groundedness": 0.77, "hallucination_rate": 0.23}
}

MISC_EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0},
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

        bars = plt.bar(
            x[idx] + offsets[i],
            [values[j] for j in idx],
            width,
            label=g.replace("_", " ").title(),
            color=SINGLE_COLORS[i],
            edgecolor="black"
        )

        for k, bar in enumerate(bars):
            h = bar.get_height()
            offset = 0.05 + (k % 3) * 0.08
            plt.text(
                bar.get_x() + bar.get_width() / 2,
                h + offset,
                f"{h:.2f}",
                ha="center",
                va="bottom",
                fontsize=VALUE_FONTSIZE
            )

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


# ---------------- COMPARISON PLOT ----------------

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

    bars1 = plt.bar(
        x - width / 2,
        v1,
        width,
        label=n1,
        color=COMPARE_COLORS[0],
        edgecolor="black"
    )

    bars2 = plt.bar(
        x + width / 2,
        v2,
        width,
        label=n2,
        color=COMPARE_COLORS[1],
        edgecolor="black"
    )

    for i in range(len(labels)):
        b1 = bars1[i]
        b2 = bars2[i]

        h1 = b1.get_height()
        h2 = b2.get_height()

        off1 = 0.6
        off2 = 0.6

        if abs(h1 - h2) < 1.0:
            off2 = 1.8

        y1 = h1 + off1 if h1 >= 0 else h1 - off1
        y2 = h2 + off2 if h2 >= 0 else h2 - off2

        plt.text(
            b1.get_x() + b1.get_width() / 2,
            y1,
            f"{h1:.2f}",
            ha="center",
            va="bottom" if h1 >= 0 else "top",
            fontsize=VALUE_FONTSIZE
        )

        plt.text(
            b2.get_x() + b2.get_width() / 2,
            y2,
            f"{h2:.2f}",
            ha="center",
            va="bottom" if h2 >= 0 else "top",
            fontsize=VALUE_FONTSIZE
        )

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
plot_single(MISC_FINANCE_METRICS, "Misc Finance Metrics", "Misc_Finance_metrics.png")
plot_single(MISC_EDUCATION_METRICS, "Misc Education Metrics", "Misc_Education_metrics.png")

# ---------------- GENERATE COMPARISON GRAPHS ----------------

plot_compare(
    LEGAL_NDA_METRICS,
    MISC_NDA_METRICS,
    "Legal NDA",
    "Misc NDA",
    "NDA Comparison",
    "NDA_comparison.png"
)

plot_compare(
    LEGAL_RENT_METRICS,
    MISC_RENT_METRICS,
    "Legal Rent",
    "Misc Rent",
    "Rent Comparison",
    "Rent_comparison.png"
)

plot_compare(
    FINANCE_METRICS,
    MISC_FINANCE_METRICS,
    "Finance",
    "Misc Finance",
    "Finance Comparison",
    "Finance_comparison.png"
)

plot_compare(
    EDUCATION_METRICS,
    MISC_EDUCATION_METRICS,
    "Education",
    "Misc Education",
    "Education Comparison",
    "Education_comparison.png"
)
