const semver = process.version.replace(/^v/, '');
const major = Number(semver.split('.')[0]);
if (major < 18) {
  console.error(`Node ${process.version} detected. RankHire requires Node 18+. Please upgrade Node.`);
  process.exitCode = 1;
} else {
  console.log(`Node ${process.version} OK.`);
}
