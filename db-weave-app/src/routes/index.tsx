import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const sectionsRef = useRef<Array<any>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in')
          }
        })
      },
      { threshold: 0.1 },
    )

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-24 lg:py-32 opacity-0"
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl xl:text-7xl font-thin tracking-tight text-gray-900 mb-6 leading-tight">
            Database design.
            <br />
            <span className="font-normal">Reimagined.</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Transform complex PostgreSQL schemas into simple, readable text.
            <br />
            Visualize relationships instantly.
          </p>
          <div className="space-y-4">
            <Link to="/editor">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                Get started
              </Button>
            </Link>
            <div className="text-gray-500 text-sm font-light mt-6">
              Start designing your schema in seconds
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-24 bg-gray-50 opacity-0"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-thin text-gray-900 mb-6 tracking-tight">
              Write code.
              <br />
              See diagrams.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Our intuitive syntax transforms into beautiful, interactive ERDs
              automatically.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2">
              {/* Left: Code */}
              <div className="p-8 lg:p-12">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Clean, readable syntax
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                    <div className="text-gray-500 mb-2">
                      // Define your schema
                    </div>
                    <div className="text-blue-400 mb-1">
                      table <span className="text-white">users</span> &#123;
                    </div>
                    <div className="ml-4 text-yellow-300">
                      id <span className="text-blue-300">serial</span>{' '}
                      <span className="text-red-400">@pk</span>
                    </div>
                    <div className="ml-4 text-yellow-300">
                      email <span className="text-blue-300">text</span>{' '}
                      <span className="text-red-400">@unique</span>
                    </div>
                    <div className="ml-4 text-yellow-300">
                      created_at{' '}
                      <span className="text-blue-300">timestamp</span>
                    </div>
                    <div className="text-white">&#125;</div>
                    <div className="mt-4 text-blue-400">
                      table <span className="text-white">posts</span> &#123;
                    </div>
                    <div className="ml-4 text-yellow-300">
                      id <span className="text-blue-300">serial</span>{' '}
                      <span className="text-red-400">@pk</span>
                    </div>
                    <div className="ml-4 text-yellow-300">
                      title <span className="text-blue-300">text</span>
                    </div>
                    <div className="ml-4 text-yellow-300">
                      user_id <span className="text-blue-300">int</span>{' '}
                      <span className="text-red-400">@fk(users.id)</span>
                    </div>
                    <div className="text-white">&#125;</div>
                  </div>
                </div>
              </div>

              {/* Right: Visual */}
              <div className="p-8 lg:p-12 bg-gray-50">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Instant visualization
                  </h3>
                  <div className="bg-[#f9fafb] rounded-lg p-6 h-80 flex items-center justify-center overflow-hidden">
                    <img
                      src="/images/erd-demo.png"
                      alt="Interactive ERD visualization showing users and posts tables with relationships"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-24 opacity-0"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-thin text-gray-900 mb-6 tracking-tight">
              Everything you need.
              <br />
              <span className="font-normal">Nothing you don't.</span>
            </h2>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6">
                  Intuitive syntax
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                  Define tables, relationships, and constraints with simple,
                  readable text. No complex SQL knowledge required.
                </p>
                <Link to="/docs">
                  <Button
                    variant="outline"
                    className="rounded-full px-6 py-3 font-medium"
                  >
                    Learn more
                  </Button>
                </Link>
              </div>
              <div className="bg-[#e0e0e0] rounded-2xl h-64 flex items-center justify-center">
                <img
                  src="/images/feature-syntax-example.png"
                  alt="Clean syntax example in code editor"
                  className="w-full h-full object-cover rounded-lg "
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="lg:order-2">
                <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6">
                  Real-time visualization
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                  See your database structure come to life with interactive ERDs
                  that update as you type.
                </p>
                <Link to="/editor">
                  <Button
                    variant="outline"
                    className="rounded-full px-6 py-3 font-medium"
                  >
                    Try it now
                  </Button>
                </Link>
              </div>
              <div className="bg-[#dddddd] rounded-2xl p-8 h-64 flex items-center justify-center lg:order-1">
                <img
                  src="/images/feature-erd-visualization.png"
                  alt="Real-time ERD visualization with multiple tables"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6">
                  Export anywhere
                </h3>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                  Generate SQL, export schemas, or integrate with your existing
                  database tools seamlessly.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-3 font-medium"
                >
                  Learn more
                </Button>
              </div>
              <div className="bg-[#ebebeb] rounded-2xl p-8 h-64 flex items-center justify-center">
                <img
                  src="/images/feature-export-options.png"
                  alt="Export options for SQL, JSON, PNG, PDF formats"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-24 bg-black text-white opacity-0"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-thin mb-6 tracking-tight">
            Ready to transform
            <br />
            <span className="font-normal">your workflow?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join developers who've simplified their database design process.
          </p>
          <div className="space-y-4">
            <Link to="/editor">
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-black px-8 py-4 text-lg font-medium rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                Get started
              </Button>
            </Link>
            <div className="text-gray-400 text-sm font-light mt-4">
              No signup required
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
