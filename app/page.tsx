
import Footer from "./components/homecomponents/Footer";
import About from "./components/homecomponents/aboutsection";
import Hero from "./components/homecomponents/herosection";
import Solutions from "./components/homecomponents/solutionsection";
import Stats from "./components/homecomponents/statesection";
import Navbar from "./components/homecomponents/Navbar";



export default function Page() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Solutions />
      <Footer />
    </div>
  );
}
