import { QuizProvider } from "../context/Quiz";
import Quiz from "./Quiz";

const Wrapper = () => {
  return (
    <QuizProvider>
      <div class="flex justify-evenly gap-2">
        <Quiz />
      </div>
    </QuizProvider>
  );
};

export default Wrapper;
