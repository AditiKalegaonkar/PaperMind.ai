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

LEGAL_NDA_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.02389322649669771, "readability": 8.471236559139811},
    "end_to_end": {"groundedness": 0.8695652173913043, "hallucination_rate": 0.13043478260869565}
}

LEGAL_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.2, "recall": 0.5, "f1": 0.28571428571428575},
    "generation": {"bleu": 0.01904256299600657, "readability": -21.11384615384611},
    "end_to_end": {"groundedness": 1.0, "hallucination_rate": 0.0}
}

FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.2, "recall": 0.3333333333333333, "f1": 0.25},
    "generation": {"bleu": 1.0, "readability": 59.68214285714288},
    "end_to_end": {"groundedness": 0.8571428571428571, "hallucination_rate": 0.14285714285714285}
}

EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.087593103737711, "readability": 18.857500000000016},
    "end_to_end": {"groundedness": 0.7777777777777778, "hallucination_rate": 0.2222222222222222}
}

MISC_NDA_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.09663075814603383, "readability": 12.236428571428604},
    "end_to_end": {"groundedness": 0.8125, "hallucination_rate": 0.1875}
}

MISC_RENT_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.1, "recall": 0.25, "f1": 0.14285714285714288},
    "generation": {"bleu": 0.007975906535156233, "readability": 8.653205128205144},
    "end_to_end": {"groundedness": 0.7959183673469388, "hallucination_rate": 0.20408163265306123}
}

MISC_FINANCE_METRICS = {
    "retrieval": {"hit_rate": 1, "mrr": 0, "precision": 0.4, "recall": 0.5, "f1": 0.4444444444444445},
    "generation": {"bleu": 0.052454471410701885, "readability": 38.27669354838713},
    "end_to_end": {"groundedness": 0.7741935483870968, "hallucination_rate": 0.22580645161290322}
}

MISC_EDUCATION_METRICS = {
    "retrieval": {"hit_rate": 0, "mrr": 0, "precision": 0.0, "recall": 0.0, "f1": 0},
    "generation": {"bleu": 0.10406104960841618, "readability": -15.884999999999962},
    "end_to_end": {"groundedness": 0.8125, "hallucination_rate": 0.1875}
}


colors_single = ["#77DD77", "#FFB347", "#AEC6CF"]
colors_compare = ["#FF6961", "#779ECB"]
metrics_sets = [("Legal NDA", LEGAL_NDA_METRICS), ("Legal Rent", LEGAL_RENT_METRICS), ("Finance", FINANCE_METRICS), ("Education", EDUCATION_METRICS),
                ("Misc NDA", MISC_NDA_METRICS), ("Misc Rent", MISC_RENT_METRICS), ("Misc Finance", MISC_FINANCE_METRICS), ("Misc Education", MISC_EDUCATION_METRICS)]


def to_lists(metrics):
    labels, values, groups = [], [], []
    for c in metrics:
        for m, v in metrics[c].items():
            labels.append(m)
            values.append(v)
            groups.append(c)
    return labels, values, groups


def plot_single_mat(ax, metrics, title):
    labels, values, groups = to_lists(metrics)
    x = np.arange(len(labels))
    width = 0.25
    offsets = [-width, 0, width]
    group_set = list(sorted(set(groups)))
    for i, g in enumerate(group_set):
        idx = [j for j, grp in enumerate(groups) if grp == g]
        ax.bar(x[idx] + offsets[i], [values[j] for j in idx], width,
               label=g, color=colors_single[i], edgecolor="black")
        for j in idx:
            ax.text(x[j] + offsets[i], values[j] + 0.01*np.sign(values[j]),
                    f"{values[j]:.2f}", ha="center", va="bottom" if values[j] >= 0 else "top", fontsize=8)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_title(title, color="black")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.7)


fig, axs = plt.subplots(2, 2, figsize=(14, 10))
for ax, (title, metrics) in zip(axs.flatten(), metrics_sets[:4]):
    plot_single_mat(ax, metrics, title)
plt.tight_layout()
plt.savefig("metrics_part1_mat.png", dpi=300)
plt.close()

fig, axs = plt.subplots(2, 2, figsize=(14, 10))
for ax, (title, metrics) in zip(axs.flatten(), metrics_sets[4:]):
    plot_single_mat(ax, metrics, title)
plt.tight_layout()
plt.savefig("metrics_part2_mat.png", dpi=300)
plt.close()


def plot_compare_mat_all(ax, m1, m2, n1, n2, title):
    labels, v1, v2 = [], [], []
    for c in m1:
        for m in m1[c]:
            labels.append(f"{c}-{m}")
            v1.append(m1[c][m])
            v2.append(m2[c].get(m, 0))
    x = np.arange(len(labels))
    width = 0.35
    bars1 = ax.bar(x - width/2, v1, width, label=n1,
                   color=colors_compare[0], edgecolor="black")
    bars2 = ax.bar(x + width/2, v2, width, label=n2,
                   color=colors_compare[1], edgecolor="black")
    for i in range(len(x)):
        ax.text(x[i] - width/2, v1[i] + 0.01*np.sign(v1[i]),
                f"{v1[i]:.2f}", ha="center", va="bottom" if v1[i] >= 0 else "top", fontsize=8)
        ax.text(x[i] + width/2, v2[i] + 0.01*np.sign(v2[i]),
                f"{v2[i]:.2f}", ha="center", va="bottom" if v2[i] >= 0 else "top", fontsize=8)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_title(title, color="black")
    ax.legend()
    ax.grid(axis="y", linestyle="--", alpha=0.7)


fig, axs = plt.subplots(2, 2, figsize=(16, 10))
plot_compare_mat_all(axs[0, 0], LEGAL_NDA_METRICS,
                     MISC_NDA_METRICS, "Legal NDA", "Misc NDA", "NDA Comparison")
plot_compare_mat_all(axs[0, 1], LEGAL_RENT_METRICS, MISC_RENT_METRICS,
                     "Legal Rent", "Misc Rent", "Rent Comparison")
plot_compare_mat_all(axs[1, 0], FINANCE_METRICS, MISC_FINANCE_METRICS,
                     "Finance", "Misc Finance", "Finance Comparison")
plot_compare_mat_all(axs[1, 1], EDUCATION_METRICS, MISC_EDUCATION_METRICS,
                     "Education", "Misc Education", "Education Comparison")
plt.tight_layout()
plt.savefig("metrics_full_comparison.png", dpi=300)
plt.close()
