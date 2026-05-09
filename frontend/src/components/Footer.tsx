import React from "react";

const Footer: React.FC = () => {
  return (
    <div className="bg-slate-800 text-white px-10 py-4 text-sm text-left">
      <br /> © 2026 Akshaya Balakrishnan. All rights reserved.
      <br /> This project is a part of my MSc thesis in Data Visualization at
      Deakin University, Australia.
      <br /> Built with React, D3.js, and Tailwind CSS.
      <br />
      View the source code on{" "}
      <a
        href="https://github.com/Aksha-1811/akshaya-self-projects-frontend"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300"
      >
        GitHub
      </a>
      . <br />
    </div>
  );
};

export default Footer;
