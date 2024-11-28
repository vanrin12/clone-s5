import { useRoutes } from "react-router-dom";
import { routes } from "../Routes";

export default function AllRouter() {
  const element = useRoutes(routes);
  return (
    <>
      {element}
    </>
  );
}
