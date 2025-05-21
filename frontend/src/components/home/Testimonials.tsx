const testimonials = [
  {
    content: "MonAvenir.tn m'a aidé à trouver ma voie. Grâce aux tests d'orientation et aux conseils personnalisés, j'ai pu choisir la formation qui me correspond vraiment.",
    author: "Sarah Ben Ali",
    role: "Étudiante en médecine"
  },
  {
    content: "Un accompagnement de qualité et des formations enrichissantes. Je recommande vivement cette plateforme à tous ceux qui cherchent à s'orienter ou à se réorienter.",
    author: "Mohamed Karim",
    role: "Professionnel en reconversion"
  },
  {
    content: "L'équipe de MonAvenir.tn est à l'écoute et très professionnelle. Les outils mis à disposition sont vraiment pertinents et utiles.",
    author: "Leila Mansour",
    role: "Parent d'élève"
  }
];

const Testimonials = () => {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-blue-600">Témoignages</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ce que disent nos utilisateurs
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <blockquote className="text-gray-700">
                  "{testimonial.content}"
                </blockquote>
                <div className="mt-6">
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 