import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { GamePage } from "./GamePage";
import { Home } from "./Home";
import "./style.css";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    path: "/concepts/:id",
    hydrateFallbackElement: (
      <p className="p-6 text-slate-300" role="status">
        Loading example…
      </p>
    ),
    lazy: async () => ({ Component: (await import("./ConceptPage")).ConceptPage }),
  },
  { path: "/:id", element: <GamePage /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
