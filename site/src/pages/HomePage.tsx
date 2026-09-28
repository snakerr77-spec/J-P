import Hero from '../components/home/Hero';
import Services from '../components/home/Services';
import About from '../components/home/About';
import Process from '../components/home/Process';
import Testimonials from '../components/home/Testimonials';
import CtaBand from '../components/home/CtaBand';
import LocationContact from '../components/home/LocationContact';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <About />
      <Process />
      <Testimonials />
      <CtaBand />
      <LocationContact />
    </>
  );
}
