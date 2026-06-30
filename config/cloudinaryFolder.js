const CLOUDINARY_ROOT = "ajbloks";

function cloudinaryFolder(segment) {
  if (!segment || segment === CLOUDINARY_ROOT) return CLOUDINARY_ROOT;
  if (segment.startsWith(CLOUDINARY_ROOT + "/")) return segment;
  return CLOUDINARY_ROOT + "/" + segment;
}

module.exports = { CLOUDINARY_ROOT, cloudinaryFolder };
