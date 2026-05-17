import React from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import { AiOutlineLineChart } from "react-icons/ai";
import { MdInsights } from "react-icons/md";
import { FiCode } from "react-icons/fi";
import Footer from "../components/Footer";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium mb-6">
                Energy Analytics Portfolio Project
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Energy Trade-Off Dashboard
              </h1>

              <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 max-w-3xl">
                An interactive frontend application built from my master’s final
                project, designed to explore residential energy consumption,
                analyze efficiency trade-offs, visualize patterns using D3.js,
                and surface predictive insights through an intuitive dashboard.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/energy-tradeoff">
                  <Button className="bg-violet-700 border-0 hover:bg-violet-800 px-4 py-2 text-white font-medium rounded-lg">
                    Open Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6
      transition-all duration-300 ease-out
      hover:hover:scale-[1.04] hover:shadow-2xl hover:border-violet-300
      hover:bg-gradient-to-br hover:from-white hover:to-violet-50"
            >
              <div
                className="w-14 h-14 flex items-center justify-center rounded-xl
        bg-violet-100 text-violet-600 text-3xl mb-5
        transition-all duration-300
        group-hover:bg-violet-600
        group-hover:text-white
        group-hover:scale-110"
              >
                <AiOutlineLineChart />
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Visual Analytics
              </h3>

              <p className="text-slate-600 leading-relaxed">
                Explore energy usage patterns, compare variables, and identify
                high-consumption zones through interactive visualizations built
                with D3.js.
              </p>
            </div>

            <div
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6
      transition-all duration-300 ease-out
      hover:hover:scale-[1.04] hover:shadow-2xl hover:border-violet-300
      hover:bg-gradient-to-br hover:from-white hover:to-violet-50"
            >
              <div
                className="w-14 h-14 flex items-center justify-center rounded-xl
        bg-violet-100 text-violet-600 text-3xl mb-5
        transition-all duration-300
        group-hover:bg-violet-600
        group-hover:text-white
        group-hover:scale-110"
              >
                <MdInsights />
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Predictive Insight
              </h3>

              <p className="text-slate-600 leading-relaxed">
                Move beyond static charts with forecasting, feature importance,
                and model-backed summaries that help explain energy behavior.
              </p>
            </div>

            <div
              className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6
      transition-all duration-300 ease-out
      hover:hover:scale-[1.04] hover:shadow-2xl hover:border-violet-300
      hover:bg-gradient-to-br hover:from-white hover:to-violet-50"
            >
              <div
                className="w-14 h-14 flex items-center justify-center rounded-xl
        bg-violet-100 text-violet-600 text-3xl mb-5
        transition-all duration-300
        group-hover:bg-violet-600
        group-hover:text-white
        group-hover:scale-110"
              >
                <FiCode />
              </div>

              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Frontend Engineering
              </h3>

              <p className="text-slate-600 leading-relaxed">
                This project highlights my ability to transform academic work
                into a clean, user-facing frontend application with strong UI
                structure and data storytelling.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
