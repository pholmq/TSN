import React from "react";
import SunMarsBinarySystem from "./SunMarsBinarySystem";

const StubObject = () => null;

const childElements = (element) =>
  React.Children.toArray(element.props.children).filter(React.isValidElement);

const directChildNamed = (element, name) =>
  childElements(element).find((child) => child.props.name === name);

const descendantNames = (element) => {
  const names = [];

  const visit = (node) => {
    if (!React.isValidElement(node)) return;
    if (node.props.name) names.push(node.props.name);
    childElements(node).forEach(visit);
  };

  visit(element);
  return names;
};

const descendantNamed = (element, name) => {
  let match;
  const visit = (node) => {
    if (match || !React.isValidElement(node)) return;
    if (node.props.name === name) {
      match = node;
      return;
    }
    childElements(node).forEach(visit);
  };
  visit(element);
  return match;
};

test("models the Sun as primary and Mars as its junior companion branch", () => {
  const binaryFrame = SunMarsBinarySystem({ ObjectComponent: StubObject });
  const sunBranch = directChildNamed(binaryFrame, "Sun Primary Branch");
  const marsBranch = descendantNamed(
    binaryFrame,
    "Mars Binary Companion Branch"
  );

  expect(binaryFrame.props.name).toBe("Sun-Mars Binary Frame");
  expect(sunBranch).toBeDefined();
  expect(marsBranch).toBeDefined();
  expect(descendantNames(sunBranch)).toContain("Sun");
  expect(descendantNames(sunBranch)).toContain("Mars");
  expect(descendantNames(marsBranch)).not.toContain("Mars deferent E");
  expect(descendantNames(marsBranch)).not.toContain("Mars deferent S");
  expect(descendantNames(marsBranch)).toContain("Mars");
  expect(descendantNames(marsBranch)).not.toContain("Sun");
  expect(descendantNames(sunBranch)).toContain(
    "Mars Native Relative Components"
  );
});

test("keeps the Martian moons in the Mars companion branch", () => {
  const binaryFrame = SunMarsBinarySystem({ ObjectComponent: StubObject });
  const marsBranch = descendantNamed(
    binaryFrame,
    "Mars Binary Companion Branch"
  );

  expect(descendantNames(marsBranch)).toEqual(
    expect.arrayContaining(["Phobos", "Deimos"])
  );
});

test("keeps the accepted Venus companion beneath the Sun", () => {
  const binaryFrame = SunMarsBinarySystem({ ObjectComponent: StubObject });
  const sunBranch = directChildNamed(binaryFrame, "Sun Primary Branch");
  const venusBranch = descendantNamed(
    sunBranch,
    "Venus Senior Solar Moon Branch"
  );

  expect(venusBranch).toBeDefined();
  expect(descendantNames(venusBranch)).toContain("Venus");
  expect(descendantNames(sunBranch)).toContain("Venus Native Relative Frame");
  expect(descendantNames(sunBranch)).not.toContain("Venus deferent A");
  expect(descendantNames(sunBranch)).not.toContain("Venus deferent B");
  expect(descendantNames(sunBranch)).not.toContain("Venus Plane");
});

test("makes Mercury an explicit Sun-hosted companion", () => {
  const binaryFrame = SunMarsBinarySystem({ ObjectComponent: StubObject });
  const sunBranch = directChildNamed(binaryFrame, "Sun Primary Branch");
  const mercuryBranch = descendantNamed(
    sunBranch,
    "Mercury Junior Solar Moon Branch"
  );

  expect(mercuryBranch).toBeDefined();
  expect(descendantNames(mercuryBranch)).toContain("Mercury");
  expect(descendantNames(sunBranch)).toContain("Mercury Native Relative Frame");
  expect(descendantNames(sunBranch)).not.toContain("Mercury deferent A");
  expect(descendantNames(sunBranch)).not.toContain("Mercury deferent B");
  expect(descendantNames(sunBranch)).not.toContain("Mercury Plane");
  expect(directChildNamed(binaryFrame, "Solar Moon Carrier Branches")).toBeUndefined();
});

test("makes Eros an explicit Sun-hosted asteroid", () => {
  const binaryFrame = SunMarsBinarySystem({ ObjectComponent: StubObject });
  const sunBranch = directChildNamed(binaryFrame, "Sun Primary Branch");
  const erosBranch = descendantNamed(sunBranch, "Eros Solar Asteroid Branch");

  expect(erosBranch).toBeDefined();
  expect(descendantNames(erosBranch)).toContain("Eros");
  expect(descendantNames(sunBranch)).toContain("Eros Native Relative Frame");
  expect(descendantNames(sunBranch)).not.toContain("Eros deferent A");
  expect(descendantNames(sunBranch)).not.toContain("Eros deferent B");
});
