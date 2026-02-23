import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="civic-section bg-primary">
    <div className="civic-container text-center">
      <h2 className="mb-4 text-h2 text-primary-foreground">
        Together, We Build Better Cities.
      </h2>
      <p className="mx-auto mb-8 max-w-lg text-body-lg text-primary-foreground/80">
        Every report counts. Join thousands of citizens making their neighborhoods
        cleaner, safer, and better maintained.
      </p>
      <Button
        size="lg"
        variant="secondary"
        className="font-semibold"
      >
        Report an Issue Now
      </Button>
    </div>
  </section>
);

export default CTASection;
