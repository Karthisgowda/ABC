# ABC

ABC is a small Node.js activity logger for recording real work entries in this repository.

## Getting Started

Clone your repository:

```bash
git clone https://github.com/Karthisgowda/ABC.git
cd ABC
```

Install dependencies:

```bash
npm install
```

Add a work entry for today:

```bash
npm run log -- "Worked on project setup"
```

The script appends the current timestamp and message to `data.json`. Commit and push your real project changes normally:

```bash
git add .
git commit -m "Update activity log"
git push origin main
```

## Note

This project records real, current activity only. It does not create backdated commits or artificial contribution history.
