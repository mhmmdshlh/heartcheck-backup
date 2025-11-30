window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');

    setTimeout(() => {
        splash.classList.add('hidden');
    }, 3000);
});

const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const bmiInput = document.getElementById('bmi');
const bmiCategory = document.getElementById('bmiCategory');

function calculateBMI() {
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);

    if (height > 0 && weight > 0) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);

        bmiInput.value = bmi;

        let category = '';
        let categoryClass = '';

        if (bmi < 18.5) {
            category = 'Kekurangan berat badan';
            categoryClass = 'underweight';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Normal';
            categoryClass = 'normal';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Kelebihan berat badan';
            categoryClass = 'overweight';
        } else {
            category = 'Obesitas';
            categoryClass = 'obese';
        }

        bmiCategory.textContent = `Kategori: ${category}`;
        bmiCategory.className = `bmi-category ${categoryClass}`;
    } else {
        bmiInput.value = '';
        bmiCategory.textContent = '';
    }
}

heightInput.addEventListener('input', calculateBMI);
weightInput.addEventListener('input', calculateBMI);

const genHealthSlider = document.getElementById('genHealth');
const genHealthValue = document.getElementById('genHealthValue');

genHealthSlider.addEventListener('input', function () {
    genHealthValue.textContent = this.value;
});

const predictionForm = document.getElementById('predictionForm');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const errorContent = document.getElementById('errorContent');

predictionForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
        AgeCategory: document.getElementById('ageCategory').value,
        Sex: document.getElementById('sex').value,
        BMI: parseFloat(document.getElementById('bmi').value),
        GenHealth: parseInt(document.getElementById('genHealth').value),
        Smoking: document.querySelector('input[name="smoking"]:checked').value,
        AlcoholDrinking: document.querySelector('input[name="alcoholDrinking"]:checked').value,
        PhysicalActivity: document.querySelector('input[name="physicalActivity"]:checked').value,
        Diabetic: document.getElementById('diabetic').value,
        Asthma: document.querySelector('input[name="asthma"]:checked').value,
        KidneyDisease: document.querySelector('input[name="kidneyDisease"]:checked').value,
        SkinCancer: document.querySelector('input[name="skinCancer"]:checked').value,
        Stroke: document.querySelector('input[name="stroke"]:checked').value,
        DiffWalking: document.querySelector('input[name="diffWalking"]:checked').value
    };

    showLoading();
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    fetch('https://mshlh.pythonanywhere.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayPredictionResult(data);
            } else {
                displayError(data.error);
            }
        })
        .catch(error => {
            displayError('Gagal terhubung ke server. Pastikan server backend sudah berjalan.');
        });
});

function showLoading() {
    resultSection.classList.remove('hidden');
    resultContent.classList.add('hidden');
    errorContent.classList.add('hidden');
    document.querySelector('.loading-state').style.display = 'block';
}

function displayPredictionResult(data) {
    document.querySelector('.loading-state').style.display = 'none';
    resultContent.classList.remove('hidden');
    errorContent.classList.add('hidden');

    const riskCircle = document.getElementById('riskCircle');
    const riskPercentageEl = document.getElementById('riskPercentage');
    const riskLabelEl = document.getElementById('riskLabel');
    const riskBarFill = document.getElementById('riskBarFill');
    const recommendationList = document.getElementById('recommendationList');

    riskCircle.style.borderColor = data.risk_color;
    riskPercentageEl.style.color = data.risk_color;
    riskPercentageEl.textContent = data.risk_probability + '%';
    riskLabelEl.style.color = data.risk_color;
    riskLabelEl.textContent = data.risk_level;

    riskBarFill.style.width = data.risk_probability + '%';
    riskBarFill.style.background = data.risk_color;

    recommendationList.innerHTML = '';
    data.recommendation.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationList.appendChild(li);
    });
}

function displayError(errorMessage) {
    document.querySelector('.loading-state').style.display = 'none';
    resultContent.classList.add('hidden');
    errorContent.classList.remove('hidden');

    document.getElementById('errorMessage').textContent = errorMessage;
}

function resetForm() {
    predictionForm.reset();
    resultSection.classList.add('hidden');
    resultContent.classList.add('hidden');
    errorContent.classList.add('hidden');
    bmiInput.value = '';
    bmiCategory.textContent = '';
    document.getElementById('predictionForm').scrollIntoView({ behavior: 'smooth' });
}

document.querySelector('.btn-start').addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
});
