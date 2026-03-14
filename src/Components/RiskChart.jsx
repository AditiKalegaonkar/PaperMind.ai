import React, { useEffect, useRef, useState } from 'react';

const PLOTLY_CDN = 'https://cdn.plot.ly/plotly-3.0.0.min.js';

let plotlyLoaded = false;
let Plotly = null;

const loadPlotly = () => {
  return new Promise((resolve, reject) => {
    if (Plotly) {
      resolve(Plotly);
      return;
    }
    if (plotlyLoaded) {
      const check = setInterval(() => {
        if (window.Plotly) {
          clearInterval(check);
          Plotly = window.Plotly;
          resolve(Plotly);
        }
      }, 100);
      return;
    }
    plotlyLoaded = true;
    const script = document.createElement('script');
    script.src = PLOTLY_CDN;
    script.onload = () => {
      Plotly = window.Plotly;
      resolve(Plotly);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const RiskChart = ({ chartCode }) => {
  const chartRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chartCode || !chartRef.current) return;

    try {
      // Extract JavaScript code from the response
      const codeMatch = chartCode.match(/<div class='plot'>([\s\S]*?)<\/div>/);
      if (!codeMatch) {
        // Try alternative pattern
        const altMatch = chartCode.match(/<div class="plot">([\s\S]*?)<\/div>/);
        if (!altMatch) {
          // Try to find any script content
          setError('No chart code found');
          return;
        }
      }
      
      const jsCode = codeMatch ? codeMatch[1] : altMatch[1];
      
      // Parse data from the code if available
      let barData = null;
      let pieData = null;
      
      // Extract bar chart data
      const barXMatch = jsCode.match(/x:\s*\[(.*?)\]/);
      const barYMatch = jsCode.match(/y:\s*\[(.*?)\]/);
      
      if (barXMatch && barYMatch) {
        const xValues = barXMatch[1].replace(/['"]/g, '').split(',').map(s => s.trim());
        const yValues = barYMatch[1].split(',').map(s => parseFloat(s.trim()));
        
        barData = {
          x: xValues,
          y: yValues,
          type: 'bar',
          marker: {
            color: ['#dc3545', '#ffc107', '#28a745'],
          },
        };
      }

      // Extract pie chart data - look for values array
      const pieValuesMatch = jsCode.match(/values:\s*\[(.*?)\]/);
      const pieLabelsMatch = jsCode.match(/labels:\s*\[(.*?)\]/);
      
      if (pieValuesMatch && pieLabelsMatch) {
        const values = pieValuesMatch[1].split(',').map(s => parseFloat(s.trim()));
        const labels = pieLabelsMatch[1].replace(/['"]/g, '').split(',').map(s => s.trim());
        
        pieData = {
          values: values,
          labels: labels,
          type: 'pie',
          marker: {
            colors: ['#525fe1', '#6c75f5', '#8b93ff', '#a5abff', '#c5caff'],
          },
        };
      }

      // If we couldn't parse, try to render what we found
      if (!barData && !pieData) {
        setError('Could not parse chart data');
        return;
      }

      const layout = {
        autosize: true,
        height: 300,
        margin: { t: 40, r: 20, b: 40, l: 40 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          family: 'DM Sans, sans-serif',
        },
        showlegend: true,
        legend: {
          orientation: 'h',
          y: -0.2,
        },
      };

      if (barData && pieData) {
        // Two charts
        Plotly.newPlot(chartRef.current, [barData, pieData], layout, { displayModeBar: false });
      } else if (barData) {
        layout.title = 'Risk Distribution by Severity';
        Plotly.newPlot(chartRef.current, [barData], layout, { displayModeBar: false });
      } else if (pieData) {
        layout.title = 'Risk Categorization by Legal Area';
        Plotly.newPlot(chartRef.current, [pieData], layout, { displayModeBar: false });
      }

    } catch (err) {
      console.error('Chart render error:', err);
      setError(err.message);
    }

    return () => {
      if (chartRef.current) {
        Plotly.purge(chartRef.current);
      }
    };
  }, [chartCode]);

  if (error) {
    return (
      <div className="pm-risk-chart-error">
        <p>Chart data: {error}</p>
      </div>
    );
  }

  return (
    <div className="pm-risk-chart">
      <div ref={chartRef} style={{ width: '100%', minHeight: '300px' }} />
    </div>
  );
};

// Parse risk data from text response
export const parseRiskData = (text) => {
  const data = {
    severity: { high: 0, medium: 0, low: 0 },
    category: {},
  };

  // Try to extract severity counts
  const highMatch = text.match(/high[:\s]+(\d+)/i);
  const mediumMatch = text.match(/medium[:\s]+(\d+)/i);
  const lowMatch = text.match(/low[:\s]+(\d+)/i);

  if (highMatch) data.severity.high = parseInt(highMatch[1]);
  if (mediumMatch) data.severity.medium = parseInt(mediumMatch[1]);
  if (lowMatch) data.severity.low = parseInt(lowMatch[1]);

  // Try to extract category counts
  const categories = ['Contract', 'Compliance', 'Intellectual Property', 'Privacy', 'Litigation'];
  categories.forEach(cat => {
    const match = text.match(new RegExp(cat + '[:\\s]+(\\d+)', 'i'));
    if (match) data.category[cat] = parseInt(match[1]);
  });

  return data;
};

export default RiskChart;
