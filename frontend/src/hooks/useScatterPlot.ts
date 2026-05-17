import { useEffect } from "react";
import * as d3 from "d3";
import { EnergyApiResponse, EnergyRow, FeatureKey } from "../types/energy";
import { UNITS } from "../constants/energy";
import { formatNum, roundTick } from "../utils/formatters";

type UseScatterPlotProps = {
  data: EnergyApiResponse | null;
  svgRef: React.RefObject<SVGSVGElement>;
  xFeature: FeatureKey;
  xMeta: { label: string; unit: string };
  selectedPoints: EnergyRow[];
  addInsightPoint: (point: EnergyRow) => void;
  getPointId: (point: EnergyRow) => string;
};

export function useScatterPlot({
  data,
  svgRef,
  xFeature,
  xMeta,
  selectedPoints,
  addInsightPoint,
  getPointId,
}: UseScatterPlotProps) {
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const rows = data.rows;
    const medianY = data.thresholds.medianY;

    const width = 820;
    const height = 420;
    const margin = { top: 24, right: 24, bottom: 56, left: 72 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(rows, (d) => d[xFeature]) as [number, number])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain(d3.extent(rows, (d) => d.Y) as [number, number])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickFormat((d) => roundTick(Number(d))),
      );

    const yAxis = svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(6)
          .tickFormat((d) => roundTick(Number(d))),
      );

    xAxis
      .selectAll("text")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .style("fill", "#6B7280");

    yAxis
      .selectAll("text")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .style("fill", "#6B7280");

    xAxis.selectAll("path,line").style("stroke", "#9CA3AF");
    yAxis.selectAll("path,line").style("stroke", "#9CA3AF");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .attr("fill", "#374151")
      .text(`${xMeta.label} (${xMeta.unit})`);

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", 18)
      .attr("fill", "#374151")
      .text(`Grid Import (Y) (${UNITS.energy})`);

    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", y(medianY))
      .attr("y2", y(medianY))
      .attr("stroke", "#9CA3AF")
      .attr("stroke-dasharray", "6 6")
      .attr("opacity", 0.9);

    svg
      .append("text")
      .attr("x", width - margin.right)
      .attr("y", y(medianY) - 8)
      .attr("text-anchor", "end")
      .attr("font-size", 18)
      .attr("fill", "#6B7280")
      .text("Efficiency boundary (median Y)");

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #E5E7EB")
      .style("border-radius", "10px")
      .style("padding", "8px 10px")
      .style("font-size", "12px")
      .style("color", "#111827")
      .style("box-shadow", "0 8px 24px rgba(0,0,0,0.08)")
      .style("opacity", 0);

    const move = (event: MouseEvent) => {
      tooltip
        .style("left", `${event.pageX + 12}px`)
        .style("top", `${event.pageY + 12}px`);
    };

    const show = (event: MouseEvent, d: EnergyRow) => {
      tooltip.style("opacity", 1).html(
        `<div style="font-weight:600;margin-bottom:4px;">Observation</div>
         <div>${xMeta.label}: ${formatNum(d[xFeature])} ${xMeta.unit}</div>
         <div>Grid import (Y): ${formatNum(d.Y)} ${UNITS.energy}</div>
         <div>Zone: ${d.Y >= medianY ? "High" : "Low"}</div>`,
      );
      move(event);
    };

    const hide = () => tooltip.style("opacity", 0);

    svg
      .append("g")
      .selectAll("circle")
      .data(rows)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d[xFeature]))
      .attr("cy", (d) => y(d.Y))
      .attr("fill", (d) => (d.Y >= medianY ? "#EF4444" : "#10B981"))
      .attr("opacity", 0.75)
      .style("cursor", "pointer")
      .attr("stroke", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d))
          ? "#111827"
          : "none",
      )
      .attr("stroke-width", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d)) ? 2 : 0,
      )
      .attr("r", (d) =>
        selectedPoints.some((p) => getPointId(p) === getPointId(d)) ? 6.5 : 4.2,
      )
      .on("click", function (_event, d) {
        addInsightPoint(d);
      })
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(120)
          .attr("r", 7.5)
          .attr("opacity", 1);
        show(event as MouseEvent, d);
      })
      .on("mousemove", function (event) {
        move(event as MouseEvent);
      })
      .on("mouseleave", function (_event, d) {
        const isSelected = selectedPoints.some(
          (p) => getPointId(p) === getPointId(d),
        );

        d3.select(this)
          .transition()
          .duration(120)
          .attr("r", isSelected ? 6.5 : 4.2)
          .attr("opacity", 0.8);

        hide();
      });

    return () => {
      tooltip.remove();
    };
  }, [
    data,
    svgRef,
    xFeature,
    xMeta,
    selectedPoints,
    addInsightPoint,
    getPointId,
  ]);
}
