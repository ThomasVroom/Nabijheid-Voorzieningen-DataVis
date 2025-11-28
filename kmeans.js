// squared euclidean distance
function distance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const d = a[i] - b[i];
        sum += d * d;
    }
    return sum;
}

// inspired by: https://medium.com/geekculture/implementing-k-means-clustering-from-scratch-in-javascript-13d71fbcb31e
export function kMeans(data, columns, k, initialCentroids = []) {
    const n = data.length;

    // only use selected columns
    const getPoint = (row) => columns.map(c => data[row][c]);
    let centroids = initialCentroids.map(i => getPoint(i));

    // if not enough initial centroids, fill randomly
    if (centroids.length < k) {
        const used = new Set(initialCentroids);
        while (centroids.length < k) {
            const idx = Math.floor(Math.random() * n);
            if (!used.has(idx)) {
                used.add(idx);
                centroids.push(getPoint(idx));
            }
        }
    }

    let assignments = new Array(n).fill(-1);

    let changed = true;
    while (changed) {
        changed = false;

        // assign points to closest centroid
        for (let i = 0; i < n; i++) {
            const p = getPoint(i);
            let best = -1;
            let bestDist = Infinity;

            for (let c = 0; c < k; c++) {
                const d = distance(p, centroids[c]);
                if (d < bestDist) {
                    bestDist = d;
                    best = c;
                }
            }

            if (assignments[i] !== best) {
                assignments[i] = best;
                changed = true;
            }
        }

        if (!changed) break;

        // recalculate centroids
        const sums = Array.from({ length: k }, () => Array(columns.length).fill(0));
        const counts = Array(k).fill(0);

        for (let i = 0; i < n; i++) {
            const c = assignments[i];
            const p = getPoint(i);
            counts[c]++;
            for (let j = 0; j < p.length; j++) {
                sums[c][j] += p[j];
            }
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] === 0) {
                // reinitialize empty cluster with a random data point
                const idx = Math.floor(Math.random() * n);
                centroids[c] = getPoint(idx);
            } else {
                centroids[c] = sums[c].map(x => x / counts[c]);
            }
        }
    }

    return assignments;
}
