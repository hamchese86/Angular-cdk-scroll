import { FormControl, FormGroup } from "@angular/forms";
import { dateRangeValidator, nonNegativePrice, priceRangeValidator } from "./product-filter.validators";

describe("product filter validators", () => {
  it("rejects a negative price", () => {
    const control = new FormControl(-1, nonNegativePrice);
    expect(control.hasError("nonNegativePrice")).toBeTrue();
  });

  it("accepts an empty optional price", () => {
    const control = new FormControl(null, nonNegativePrice);
    expect(control.valid).toBeTrue();
  });

  it("rejects a minimum price greater than the maximum", () => {
    const form = new FormGroup({ minPrice: new FormControl(200), maxPrice: new FormControl(100) }, priceRangeValidator);
    expect(form.hasError("priceRange")).toBeTrue();
  });

  it("rejects a reversed date range", () => {
    const form = new FormGroup(
      { availableFrom: new FormControl("2026-12-01"), availableTo: new FormControl("2026-01-01") },
      dateRangeValidator
    );
    expect(form.hasError("dateRange")).toBeTrue();
  });
});
