import BSCStars from "./BSCStars";

export default function BSCStarsHandler() {
  return (
    <BSCStars
      onStarClick={({ star, position, index }) => {
        console.log("Clicked star:", star.name, "at position:", position);
      }}
      onStarHover={(data) => {
        if (data) {
          console.log("Hovering over:", data.star.name);
        } else {
          console.log("No star hovered");
        }
      }}
    />
  );
}
