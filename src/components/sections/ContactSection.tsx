import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
              Partner With Us
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lead the Change in
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Women's Health</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Let's make a difference together! We invite you to be part of the change. 
              Let's redefine menstrual wellness at your workplace.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                        <p className="text-muted-foreground">+91 8977137767</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Email</h4>
                        <p className="text-muted-foreground">velagapudi.bannu@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Contact Person</h4>
                        <p className="text-muted-foreground">Naga Vamsi Velagapudi</p>
                        <p className="text-sm text-muted-foreground">Designated Partner, Farmfit Agrihealth LLP</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card className="overflow-hidden bg-gradient-card">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">About Farmfit Agrihealth</h3>
                  <p className="text-muted-foreground mb-4">
                    "We care for what connects us all—life in every form."
                  </p>
                  <p className="text-sm text-muted-foreground">
                    At FarmFit AgriHealth, we're committed to the well-being of all life—humans, animals, 
                    plants, and the ecosystems they share. Our purpose goes beyond individual care to 
                    support the health of the environment as a whole.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;