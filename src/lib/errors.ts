/** Turn database error codes (raised as "CODE:detail") into customer-friendly messages. */
export function friendlyError(message: string | undefined): string {
  const m = message || "";
  if (m.startsWith("OUT_OF_STOCK:")) return `Sorry, ${m.slice(13)} is out of stock or has less stock than you asked for.`;
  if (m.startsWith("UNAVAILABLE:")) return "One of the items is no longer available. Please review your cart.";
  switch (m) {
    case "INVALID:name":
      return "Please enter your name.";
    case "INVALID:phone":
      return "Please enter a valid Brunei mobile number (7 digits).";
    case "INVALID:address":
      return "Please enter your area and address.";
    case "INVALID:district":
      return "Please choose your district.";
    case "INVALID:cart_empty":
      return "Your cart is empty.";
    case "INVALID:variant_required":
      return "Please choose an option (e.g. colour) for each item.";
    case "INVALID:services":
      return "Pick at least one repair, or describe the problem under “Something else”.";
    case "INVALID:model":
      return "Please enter your phone model.";
    case "INVALID:issue":
      return "Please describe the problem in a few words.";
  }
  return "Something went wrong. Please try again or message us on WhatsApp.";
}
