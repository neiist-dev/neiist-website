/* 
  This is a custom hook to keep track of the size of a window more information 
  about hooks in (https://reactjs.org/docs/hooks-overview.html).
*/
import { useState, useEffect } from "react";
/* 
  Import useState (to keep track of the state of the browser window)
  and the hook useEffect.
*/

const getSize = () => {
  /* returns an object containing the browser's inner width and inner height from the window object. */
  return {
    innerHeight: window.innerHeight,
    innerWidth: window.innerWidth
  };
};

const useWindowSize = () => {
  let [ windowSize, setWindowSize] = useState(getSize());

  const handleResize = () => {
    setWindowSize(getSize());
  }

  useEffect(() => {

    window.addEventListener("resize", handleResize);
    /* 
      event listener that listens to the resize event and will invoke a function called handleResize()
      every time the window is resized. 
    */

    return () => {
      window.removeEventListener("resize", handleResize);
    }
    /* return a function that removes this event listener.*/
  }, []);

  return windowSize
};

export default useWindowSize;