// Skeleton: Homepage Insights entry button (not auto-executed)
export function createHomeInsightsEntry(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.textContent = "观影报告";
  btn.title = "打开观影报告（Dashboard）";
  btn.addEventListener("click", () => {
    // TODO: open Dashboard to Insights tab
  });
  return btn;
}
