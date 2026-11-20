import { responseExplanation, responseFigure, responseSentence } from "./responseTime";

/*
 * The highlights under an instructor's name - the circles that open like
 * stories. Each is built from what the profile already holds, so an
 * instructor has nothing extra to fill in, and one with nothing to show
 * (no price set, too few requests to judge reply times) is left out rather
 * than shown empty.
 *
 * A highlight: { id, title, icon, sections: [{ heading, items: [text] }], note }.
 */
export function profileHighlights(instructor, labels = {}) {
  const { counties = {}, centres = {}, categories = {} } = labels;
  const highlights = [];

  if (instructor.isVerified) {
    highlights.push({
      id: "verified",
      title: "Verified",
      icon: "shield",
      sections: [{ heading: "ADI number", items: ["Checked against the RSA register"] }],
      note: "Pro.me checks every instructor's ADI number before it shows this badge.",
    });
  }

  const areas = (instructor.counties ?? []).map((slug) => counties[slug] ?? slug);
  const testCentres = (instructor.testCentres ?? []).map((slug) => centres[slug] ?? slug);
  if (areas.length) {
    highlights.push({
      id: "areas",
      title: "Areas",
      icon: "pin",
      sections: [
        { heading: areas.length === 1 ? "County" : "Counties", items: areas },
        ...(testCentres.length ? [{ heading: "Test centres", items: testCentres }] : []),
      ],
    });
  }

  const licences = (instructor.licenceCategories ?? []).map((code) =>
    categories[code] ? `${categories[code]} (${code})` : code
  );
  const gearboxes = (instructor.transmission ?? []).map((value) => (value === "automatic" ? "Automatic" : "Manual"));
  if (licences.length || gearboxes.length) {
    highlights.push({
      id: "teaches",
      title: "Teaches",
      icon: "car",
      sections: [
        ...(licences.length ? [{ heading: "Licences", items: licences }] : []),
        ...(gearboxes.length ? [{ heading: "Gearbox", items: gearboxes }] : []),
      ],
    });
  }

  const hasPrice = instructor.pricePerLesson !== null && instructor.pricePerLesson !== undefined;
  highlights.push({
    id: "prices",
    title: "Prices",
    icon: "euro",
    sections: [
      ...(hasPrice ? [{ heading: "A lesson", items: [`€${instructor.pricePerLesson}`] }] : []),
      {
        heading: "New learners",
        items: [instructor.acceptingNewStudents ? "Taking new learners" : "Not taking new learners right now"],
      },
    ],
  });

  if (instructor.responseTime) {
    highlights.push({
      id: "replies",
      title: "Replies",
      icon: "clock",
      sections: [
        { heading: "Typical reply", items: [responseFigure(instructor.responseTime)] },
        { heading: "In words", items: [responseSentence(instructor.responseTime)].filter(Boolean) },
      ],
      note: responseExplanation(instructor.responseTime),
    });
  }

  return highlights;
}
