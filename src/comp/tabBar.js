import { useEffect } from "react";

export default function TabBar({onKeyDown}) {


//Listens to key press
  useEffect(() => {
    const handleKeyDown = (event) => {
      onKeyDown(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown); // Cleanup
    };
  },);

  return (
    <div>Press any key</div>
  );
}