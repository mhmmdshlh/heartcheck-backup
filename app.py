from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

with open('rf_model2.pkl', 'rb') as file:
    model = joblib.load(file)

AGE_MAPPING = {
    '18-24': 0, '25-29': 1, '30-34': 2, '35-39': 3, '40-44': 4,
    '45-49': 5, '50-54': 6, '55-59': 7, '60-64': 8, '65-69': 9,
    '70-74': 10, '75-79': 11, '80 or older': 12
}

SEX_MAPPING = {'Male': 1, 'Female': 0}

GENHEALTH_MAPPING = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4}

DIABETIC_MAPPING = {
    'No': 0,
    'Yes': 1,
    'No, borderline diabetes': 2,
    'Yes (during pregnancy)': 3
}

YES_NO_MAPPING = {'Yes': 1, 'No': 0}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        data = request.json
        
        input_data = {
            'AgeCategory': AGE_MAPPING.get(data['AgeCategory'], 0),
            'Sex': SEX_MAPPING.get(data['Sex'], 0),
            'BMI': float(data['BMI']),
            'GenHealth': int(data['GenHealth']),
            'Smoking': YES_NO_MAPPING.get(data['Smoking'], 0),
            'AlcoholDrinking': YES_NO_MAPPING.get(data['AlcoholDrinking'], 0),
            'PhysicalActivity': YES_NO_MAPPING.get(data['PhysicalActivity'], 0),
            'Diabetic': DIABETIC_MAPPING.get(data['Diabetic'], 0),
            'Asthma': YES_NO_MAPPING.get(data['Asthma'], 0),
            'KidneyDisease': YES_NO_MAPPING.get(data['KidneyDisease'], 0),
            'SkinCancer': YES_NO_MAPPING.get(data['SkinCancer'], 0),
            'Stroke': YES_NO_MAPPING.get(data['Stroke'], 0),
            'DiffWalking': YES_NO_MAPPING.get(data['DiffWalking'], 0)
        }
        
        df = pd.DataFrame([input_data])
        
        prediction = model.predict(df)[0]
        prediction_proba = model.predict_proba(df)[0]
        
        risk_probability = prediction_proba[1] * 100
        
        if risk_probability < 20:
            risk_level = 'Rendah'
            risk_color = '#10b981'
        elif risk_probability < 50:
            risk_level = 'Sedang'
            risk_color = '#f59e0b'
        elif risk_probability < 75:
            risk_level = 'Tinggi'
            risk_color = '#ef4444'
        else:
            risk_level = 'Sangat Tinggi'
            risk_color = '#dc2626'
        
        response = {
            'success': True,
            'prediction': int(prediction),
            'risk_probability': round(risk_probability, 2),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'recommendation': get_recommendation(risk_level, input_data)
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def get_recommendation(risk_level, data):
    recommendations = []
    
    if risk_level in ['Tinggi', 'Sangat Tinggi']:
        recommendations.append('Segera konsultasikan dengan dokter atau ahli jantung')
        recommendations.append('Lakukan pemeriksaan jantung menyeluruh (EKG, echocardiogram)')
    elif risk_level == 'Sedang':
        recommendations.append('Pertimbangkan untuk berkonsultasi dengan dokter')
        recommendations.append('Monitor kesehatan jantung secara rutin')
    else:
        recommendations.append('Pertahankan gaya hidup sehat Anda')
    
    if data['Smoking'] == 1:
        recommendations.append('Berhenti merokok - faktor risiko utama penyakit jantung')
    
    if data['AlcoholDrinking'] == 1:
        recommendations.append('Kurangi konsumsi alkohol')
    
    if data['PhysicalActivity'] == 0:
        recommendations.append('Tingkatkan aktivitas fisik (minimal 150 menit/minggu)')
    
    if data['BMI'] > 25:
        recommendations.append('Pertahankan berat badan ideal dengan diet seimbang')
    
    if data['Diabetic'] in [1, 2, 3]:
        recommendations.append('Kontrol kadar gula darah secara teratur')
    
    recommendations.append('Konsumsi makanan bergizi, rendah lemak jenuh')
    recommendations.append('Tidur cukup (7-8 jam per hari)')
    recommendations.append('Kelola stres dengan baik')
    
    return recommendations

if __name__ == '__main__':
    app.run(debug=False, port=5000)
