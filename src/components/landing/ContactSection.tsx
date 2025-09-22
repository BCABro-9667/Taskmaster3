
import { Phone, Mail, MapPin, Link as LinkIcon } from 'lucide-react';
import { ContactForm } from './ContactForm';

export function ContactSection() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                Contact Us
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Get in Touch
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Have questions or want to learn more? We're here to help. Reach out to us through any of the channels below.
            </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold font-headline text-primary">Contact Information</h3>
                <p className="text-muted-foreground">Fill out the form or use the details below to contact us.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Our Office</h4>
                  <p className="text-muted-foreground">IMT Manesar, Gurgaon - 122 505 (Hr)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Email Us</h4>
                  <a href="mailto:avdhesh966734@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                    avdhesh966734@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Call Us</h4>
                  <a href="tel:+919667346203" className="text-muted-foreground hover:text-primary transition-colors">
                    +91 96673 46203
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                  <LinkIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Developer Portfolio</h4>
                  <a href="https://avdheshh-portfolio.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    avdheshh-portfolio.netlify.app
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
