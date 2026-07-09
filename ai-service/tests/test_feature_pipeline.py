from app.ml.features.feature_pipeline import FeaturePipeline


def test_feature_pipeline_produces_expected_keys():
    pipeline = FeaturePipeline()
    features = pipeline.transform(
        {
            "destination_pincode": "110001",
            "available_couriers": ["delhivery", "bluedart"],
            "cod": True,
            "cod_amount": 1499,
            "order_value": 1499,
            "weight_grams": 500,
            "address_quality_score": 0.72,
        }
    )
    assert features["pincode_risk_score"] == 15
    assert 0 <= features["address_quality_score"] <= 1


def test_rural_pincode_has_higher_default_risk():
    pipeline = FeaturePipeline()
    metro = pipeline.transform(
        {
            "destination_pincode": "110001",
            "available_couriers": ["delhivery"],
            "cod": False,
            "cod_amount": None,
            "order_value": 1000,
            "weight_grams": 500,
            "address_quality_score": 0.8,
        }
    )
    rural = pipeline.transform(
        {
            "destination_pincode": "845401",
            "available_couriers": ["delhivery"],
            "cod": False,
            "cod_amount": None,
            "order_value": 1000,
            "weight_grams": 500,
            "address_quality_score": 0.8,
            "pincode_context": {
                "risk_score": 72.8,
                "success_rate": 0.62,
                "rto_rate": 0.38,
                "avg_delivery_days": 6.2,
                "tier": "RURAL",
                "source": "DATABASE",
                "courier_breakdown": [],
            },
        }
    )
    assert rural["pincode_risk_score"] > metro["pincode_risk_score"]
