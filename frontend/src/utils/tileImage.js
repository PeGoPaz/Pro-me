/* The picture an instructor shows in a grid: their newest post, else their
   profile photo; null when they have neither and their initials stand in. */
export const tileImage = (instructor) => instructor.posts?.[0]?.url || instructor.profilePhotoUrl || null;
