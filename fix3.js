const fs = require('fs');
let scriptContent = fs.readFileSync('script.js', 'utf-8');

const newUpdateRotate = `
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    const rotate = progress;
    wrapper.style.setProperty('--rotate', rotate.toFixed(4));
    
    let activeIndex = -1;
    let minPhaseDist = Infinity;
    
    cards.forEach((card, index) => {
      const phase = (index) / total - 0.75;
      let pos = (phase + rotate + 1) % 1;
      if (pos < 0) pos += 1;
      const dist = Math.min(pos, 1 - pos);
      
      const grayscale = Math.max(0, Math.min(dist * total * 1.4, 1));
      const opacity = 1 - (dist / 0.22);
      
      const focusRange = 0.1;
      const maxBlur = 5;
      const normDist = Math.min(dist, focusRange);
      const blurProgress = normDist / focusRange;
      const blur = blurProgress * maxBlur;
      
      const activeProgress = Math.max(0, Math.min(1 - (dist / 0.035), 1));
      const scale = 0.58 + 0.72 * activeProgress;
      
      card.style.setProperty('--card-blur', blur.toFixed(2) + 'px');
      card.style.setProperty('--card-scale', scale.toFixed(3));
      card.style.setProperty('--card-opacity', Math.max(0.35, opacity).toFixed(3));
      card.style.setProperty('--card-grayscale', grayscale.toFixed(3));
      
      if (dist < minPhaseDist) {
        minPhaseDist = dist;
        activeIndex = index;
      }
    });

    if (activeIndex !== -1) {
       const activeCard = cards[activeIndex];
       const titleEl = document.getElementById('activeProductTitle');
       const descEl = document.getElementById('activeProductDesc');
       if (titleEl) titleEl.textContent = activeCard.dataset.title || '';
       if (descEl) descEl.textContent = activeCard.dataset.desc || '';
    }
  };
`;

scriptContent = scriptContent.replace(
  /const updateRotate = \(\) => \{[\s\S]*?\};\s*window\.addEventListener\('scroll', updateRotate/m,
  "const updateRotate = () => {" + newUpdateRotate + "\n  window.addEventListener('scroll', updateRotate"
);

fs.writeFileSync('script.js', scriptContent, 'utf-8');

let styleContent = fs.readFileSync('style.css', 'utf-8');
styleContent = styleContent.replace(/--card-dist:.*?;/g, '');
styleContent = styleContent.replace(/--card-grayscale:.*?;/g, '');
styleContent = styleContent.replace(/--card-opacity:.*?;/g, '');
styleContent = styleContent.replace(/--card-focus-range:.*?;/g, '');
styleContent = styleContent.replace(/--card-max-blur:.*?;/g, '');
styleContent = styleContent.replace(/--card-norm-dist:.*?;/g, '');
styleContent = styleContent.replace(/--card-blur-progress:.*?;/g, '');
styleContent = styleContent.replace(/--card-blur:.*?;/g, '');
styleContent = styleContent.replace(/--card-active:.*?;/g, '');
styleContent = styleContent.replace(/--card-scale:.*?;/g, '');

fs.writeFileSync('style.css', styleContent, 'utf-8');
console.log("Updated script.js and style.css successfully.");
