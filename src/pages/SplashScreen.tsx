import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { ScrollText, Sun, Moon } from "lucide-react";

const maskStyle = {
  WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
  maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
};

export function SplashScreen() {
  const navigate = useNavigate();
  const actions = useGameStore((s) => s.actions);
  const [visible, setVisible] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem("kongsi-theme") === "light";
  });

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("kongsi-theme", isLight ? "light" : "dark");
  }, [isLight]);

  const handleStart = () => {
    actions.newGame();
    navigate("/intro");
  };

  const handleLoad = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      actions.loadGame(text);
      navigate("/dashboard");
    };
    input.click();
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 ${
        isLight ? "bg-[#F2F1EC]" : "bg-[#272B2E]"
      }`}
    >
      <div
        className={`relative z-10 max-w-lg w-full text-center space-y-10 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex justify-center">
          <img
            src={isLight ? "/assets/kongsi-light.webp" : "/assets/kongsi-dark.webp"}
            alt="Kongsi"
            className="w-full max-w-xs h-auto"
            style={maskStyle}
          />
        </div>

        <div
          className={`space-y-3 transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <button
            type="button"
            onClick={handleStart}
            className={`w-full px-8 py-4 text-[17px] font-semibold transition-all active:scale-[0.98] ${
              isLight
                ? "bg-[#272B2E] text-white hover:bg-[#1a1d1f]"
                : "bg-[#F2F1EC] text-[#272B2E] hover:bg-white"
            }`}
          >
            Start New Game
          </button>

          <button
            type="button"
            onClick={handleLoad}
            className={`w-full border px-8 py-3.5 text-[15px] transition-all active:scale-[0.98] ${
              isLight
                ? "border-[#c4bdb2] text-[#6a6258] hover:border-[#8a6e28] hover:text-[#8a6e28]"
                : "border-[#3e3e3e] text-[#a09890] hover:border-[#d4b458] hover:text-[#d4b458]"
            }`}
          >
            Load Save File
          </button>
        </div>

        <div
          className={`flex items-center justify-center gap-6 transition-all duration-700 delay-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Link
            to="/changelog"
            className={`inline-flex items-center gap-2 text-[14px] transition-colors ${
              isLight
                ? "text-[#8a8278] hover:text-[#8a6e28]"
                : "text-[#787068] hover:text-[#d4b458]"
            }`}
          >
            <ScrollText size={15} />
            Changelog
          </Link>

          <button
            type="button"
            onClick={() => setIsLight(!isLight)}
            className={`inline-flex items-center gap-2 text-[14px] transition-colors ${
              isLight
                ? "text-[#8a8278] hover:text-[#8a6e28]"
                : "text-[#787068] hover:text-[#d4b458]"
            }`}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
            {isLight ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </div>
    </div>
  );
}
