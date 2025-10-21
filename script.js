let pointCount = 6;

function addPoint() {
    pointCount++;
    document.getElementById('points-container').innerHTML += `
        <div class="point-input"><label>نقطه ${pointCount} (x${pointCount}, y${pointCount}):</label><input type="number" class="x" placeholder="x" step="any"><input type="number" class="y" placeholder="y" step="any"><button onclick="removePoint(this)">حذف</button></div>`;
}

function removePoint(btn) {
    if (pointCount > 1) {
        btn.parentElement.remove();
        pointCount--;
        document.querySelectorAll('.point-input').forEach((p, i) => p.querySelector('label').textContent = `نقطه ${i + 1} (x${i + 1}, y${i + 1}):`);
    }
}

function clearPoints() {
    document.getElementById('points-container').innerHTML = `<div class="point-input"><label>نقطه ۱ (x₁, y₁):</label><input type="number" class="x" placeholder="x" step="any"><input type="number" class="y" placeholder="y" step="any"><button onclick="removePoint(this)">حذف</button></div>`;
    pointCount = 1;
    document.getElementById('result').innerHTML = '';
    document.getElementById('error').style.display = 'none';
    document.getElementById('polygonCanvas').getContext('2d').clearRect(0, 0, 400, 400);
}

function area(x1, y1, x2, y2, x3, y3) {
    return 0.5 * Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
}

function polygonArea(points) {
    let area = 0;
    for (let i = 0, n = points.length; i < n; i++) {
        const j = (i + 1) % n;
        area += points[i].x * points[j].y - points[i].y * points[j].x;
    }
    return 0.5 * Math.abs(area);
}

function sideLength(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function sortPoints(points) {
    const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }), { x: 0, y: 0 });
    return points.sort((a, b) => Math.atan2(a.y - centroid.y, a.x - centroid.x) - Math.atan2(b.y - centroid.y, b.x - centroid.x));
}

function isEar(points, i, n) {
    const prev = (i - 1 + n) % n, next = (i + 1) % n;
    const x0 = points[prev].x, y0 = points[prev].y, x1 = points[i].x, y1 = points[i].y, x2 = points[next].x, y2 = points[next].y;
    if ((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0) <= 0) return false;
    for (let j = 0; j < n; j++) {
        if (j !== prev && j !== i && j !== next && isPointInTriangle(points[j].x, points[j].y, x0, y0, x1, y1, x2, y2)) return false;
    }
    return true;
}

function isPointInTriangle(px, py, x0, y0, x1, y1, x2, y2) {
    const total = area(x0, y0, x1, y1, x2, y2);
    const a1 = area(px, py, x1, y1, x2, y2), a2 = area(x0, y0, px, py, x2, y2), a3 = area(x0, y0, x1, y1, px, py);
    return Math.abs(total - (a1 + a2 + a3)) < 1e-10;
}

function triangulate(points) {
    let triangles = [], vertices = points.slice(), n = vertices.length;
    while (n > 3) {
        let earFound = false;
        for (let i = 0; i < n; i++) {
            if (isEar(vertices, i, n)) {
                const prev = (i - 1 + n) % n, next = (i + 1) % n;
                triangles.push([vertices[prev], vertices[i], vertices[next]]);
                vertices.splice(i, 1);
                n--;
                earFound = true;
                break;
            }
        }
        if (!earFound) return [];
    }
    if (n === 3) triangles.push(vertices);
    return triangles;
}

function drawPolygon(points, triangles) {
    const canvas = document.getElementById('polygonCanvas'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const range = Math.max(maxX - minX, maxY - minY) || 1, scale = 300 / range, offset = 50;
    const scaled = points.map(p => ({ x: (p.x - minX) * scale + offset, y: canvas.height - ((p.y - minY) * scale + offset) }));

    triangles.forEach((t, i) => {
        ctx.beginPath();
        ctx.moveTo(scaled[points.indexOf(t[0])].x, scaled[points.indexOf(t[0])].y);
        ctx.lineTo(scaled[points.indexOf(t[1])].x, scaled[points.indexOf(t[1])].y);
        ctx.lineTo(scaled[points.indexOf(t[2])].x, scaled[points.indexOf(t[2])].y);
        ctx.closePath();
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
        ctx.fill();
        ctx.fillStyle = 'blue';
        ctx.font = '14px Vazirmatn';
        ctx.fillText(i + 1, (scaled[points.indexOf(t[0])].x + scaled[points.indexOf(t[1])].x + scaled[points.indexOf(t[2])].x) / 3, (scaled[points.indexOf(t[0])].y + scaled[points.indexOf(t[1])].y + scaled[points.indexOf(t[2])].y) / 3);
    });

    ctx.beginPath();
    ctx.moveTo(scaled[0].x, scaled[0].y);
    scaled.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'red';
    scaled.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '12px Vazirmatn';
        ctx.fillText(`(${points[i].x}, ${points[i].y})`, p.x + 10, p.y - 10);
    });
}

function calculateAndDraw() {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';

    const points = [];
    document.querySelectorAll('.point-input').forEach(p => {
        const x = parseFloat(p.querySelector('.x').value), y = parseFloat(p.querySelector('.y').value);
        if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
    });

    if (points.length < 3) {
        errorDiv.textContent = 'لطفاً حداقل ۳ نقطه وارد کنید.';
        errorDiv.style.display = 'block';
        document.getElementById('result').innerHTML = '';
        return;
    }

    sortPoints(points);
    if (polygonArea(points) === 0) {
        errorDiv.textContent = 'نقاط واردشده یک چندضلعی معتبر تشکیل نمی‌دهند.';
        errorDiv.style.display = 'block';
        document.getElementById('result').innerHTML = '';
        return;
    }

    const triangles = triangulate(points);
    if (!triangles.length) {
        errorDiv.textContent = 'خطا در تقسیم‌بندی به مثلث‌ها. لطفاً ترتیب نقاط را بررسی کنید.';
        errorDiv.style.display = 'block';
        document.getElementById('result').innerHTML = '';
        return;
    }

    const totalArea = polygonArea(points);
    const triangleAreas = triangles.map((t, i) => ({
        index: i + 1,
        area: area(t[0].x, t[0].y, t[1].x, t[1].y, t[2].x, t[2].y),
        points: `(${t[0].x}, ${t[0].y}), (${t[1].x}, ${t[1].y}), (${t[2].x}, ${t[2].y})`
    }));

    const sides = points.map((p, i) => {
        const j = (i + 1) % points.length;
        return `ضلع ${i + 1} (${p.x}, ${p.y}) به (${points[j].x}, ${points[j].y}): ${sideLength(p.x, p.y, points[j].x, points[j].y)}`;
    });

    document.getElementById('result').innerHTML = `
        <strong>مساحت کل چندضلعی:</strong> ${totalArea} واحد مربع<br>
        <strong>مساحت مثلث‌ها:</strong><br>${triangleAreas.map(t => `مثلث ${t.index} (${t.points}): ${t.area} واحد مربع`).join('<br>')}<br>
        <strong>طول اضلاع:</strong><br>${sides.join('<br>')}
    `;
    drawPolygon(points, triangles);
}