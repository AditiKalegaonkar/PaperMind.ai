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

# ===================== GLOBAL VISUAL SETTINGS =====================

BAR_THICKNESS = 0.8
FONT_PER_BAR = 55

SINGLE_COLORS = ["#E67E22", "#27AE60", "#8E44AD"]

# ===================== DATA =====================

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

# ===================== HELPERS =====================


def to_lists(metrics):
    labels, values, groups = [], [], []
    for c in metrics:
        for m, v in metrics[c].items():
            labels.append(m)
            values.append(v)
            groups.append(c)
    return labels, values, groups


# ===================== HORIZONTAL SINGLE GRAPH =====================

def plot_single(metrics, title, filename):

    labels, values, groups = to_lists(metrics)
    group_set = list(sorted(set(groups)))

    # Increase spacing between metric groups
    base_y = np.arange(len(labels)) * 5.5
    # Adjust offset to prevent overlap
    offsets = np.linspace(-1.2, 1.2, len(group_set))

    # Adjusted figure size for better proportions with larger fonts
    fig, ax = plt.subplots(figsize=(36, 24))

    fs = int(BAR_THICKNESS * FONT_PER_BAR)

    vmax = max(values)
    vmin = min(values)
    span = vmax - vmin if vmax != vmin else 1

    # Increased text gap for better spacing
    text_gap = span * 0.03

    for i, g in enumerate(group_set):

        idx = [j for j, grp in enumerate(groups) if grp == g]
        y = base_y[idx] + offsets[i]

        bars = ax.barh(
            y,
            [values[j] for j in idx],
            height=BAR_THICKNESS,
            color=SINGLE_COLORS[i],
            edgecolor="black",
            linewidth=1.5,
            zorder=3
        )

        for bar in bars:
            w = bar.get_width()

            # Adjusted positioning to prevent overlap
            if w >= 0:
                x = w + text_gap
                ha = "left"
            else:
                x = w - text_gap
                ha = "right"

            ax.text(
                x,
                bar.get_y() + bar.get_height() / 2,
                f"{w:.2f}",
                va="center",
                ha=ha,
                fontsize=fs,
                zorder=4,
                clip_on=False
            )

    ax.set_yticks(base_y)
    ax.set_yticklabels(labels, fontsize=fs)
    ax.tick_params(axis="x", labelsize=fs)
    ax.tick_params(axis="y", which='major', pad=15)

    ax.xaxis.set_major_locator(MaxNLocator(6))
    ax.xaxis.set_major_formatter(FormatStrFormatter("%.2f"))

    ax.set_title(title, fontsize=int(fs * 1.4), pad=35, fontweight='bold')
    ax.set_xlabel("Score", fontsize=int(fs * 1.1),
                  labelpad=25, fontweight='semibold')
    ax.set_ylabel("Metrics", fontsize=int(fs * 1.1),
                  labelpad=25, fontweight='semibold')

    ax.grid(axis="x", linestyle="--", alpha=0.4, zorder=0, linewidth=1.2)

    # Adjusted margins to ensure all text is visible and graph is connected at left
    # If all values are positive, start from 0; otherwise start from min value
    left = min(0, vmin) - span * 0.05 if vmin < 0 else 0
    right = vmax + span * 0.15
    ax.set_xlim(left, right)

    # Adjust subplot to prevent label cutoff
    fig.subplots_adjust(left=0.25, right=0.95, top=0.95, bottom=0.08)

    # Improve spine appearance
    for spine in ax.spines.values():
        spine.set_linewidth(1.5)
        spine.set_edgecolor('#333333')

    fig.savefig(filename, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close(fig)


# ===================== GENERATE ALL SINGLE GRAPHS =====================

print("Generating improved visualizations...")

plot_single(LEGAL_NDA_METRICS, "Legal NDA Metrics", "Legal_NDA_metrics.png")
print("✓ Legal NDA Metrics")

plot_single(LEGAL_RENT_METRICS, "Legal Rent Metrics", "Legal_Rent_metrics.png")
print("✓ Legal Rent Metrics")

plot_single(FINANCE_METRICS, "Finance Metrics", "Finance_metrics.png")
print("✓ Finance Metrics")

plot_single(EDUCATION_METRICS, "Education Metrics", "Education_metrics.png")
print("✓ Education Metrics")

plot_single(MISC_NDA_METRICS, "Misc NDA Metrics", "Misc_NDA_metrics.png")
print("✓ Misc NDA Metrics")

plot_single(MISC_RENT_METRICS, "Misc Rent Metrics", "Misc_Rent_metrics.png")
print("✓ Misc Rent Metrics")

plot_single(MISC_FINANCE_METRICS, "Misc Finance Metrics",
            "Misc_Finance_metrics.png")
print("✓ Misc Finance Metrics")

plot_single(MISC_EDUCATION_METRICS, "Misc Education Metrics",
            "Misc_Education_metrics.png")
print("✓ Misc Education Metrics")

print("\nAll visualizations generated successfully!")
