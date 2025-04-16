"use client"
  import React from 'react'
  const LandingPage = () => {
    return (
      <div
        style={{
          backgroundImage: "url('/SRMIST-BANNER.jpg')",
          backgroundSize: "cover", // Important: Use cover
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          width: "100%",
          height: "100vh",
        }}
      >
          <div className="absolute inset-0 hero-overlay  bg-opacity-10 mt-16 "></div>
        <div className="min-h-screen flex flex-col justify-center items-center text-white"> {/* Add text-white and remove bg-white */}
          <section className="py-16 md:py-20 lg:py-24 max-w-6xl mx-auto px-6 md:px-12 lg:px-24">
            <div className="flex flex-col justify-start lg:flex-row max-w-6xl mx-auto">

              <div className="lg:w-1/2 lg:pr-12 text-left lg:text-left mb-10 lg:mb-0">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 text-white opacity-90">
                    SRM Institute of Science and <span className="text-blue-400">Technology</span>
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-semibold leading-relaxed opacity-65">
                    Faculty of Engineering and Technology
                  </h2>
                </div>
                <p className="mb-8 text-lg leading-relaxed opacity-90">
                  A powerful platform developed by Department of Computing Technology to revolutionize event management.
                  Streamline creation, submission, and review processes for enhanced efficiency and collaboration.
                </p>
              </div>

            </div>
          </section>
        </div>
      </div>
    )
  }

  export default LandingPage;