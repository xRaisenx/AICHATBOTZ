export const testQueries: string[] = [
    // --- Basic Greetings & Info ---
    "hello",
    "hi there",
    "what can you do?",
    "tell me about Planet Beauty",
    "what are your store hours?", // Example of unsupported query

    // --- Specific Product Queries ---
    "Omnilux Blemish Eraser",
    "Elta MD Skincare UV Physical SPF40 Rosy",
    "Borghese Energia Retinol Renewal Night Oil",
    "Do you have the Pureology Hydrate Shampoo?",
    "Looking for Olaplex No. 3",
    "Enjoy Holistic Hydrate Conditioner, 33.OZ",
    "Nioxin System 1 Scalp + Hair Shampoo and Conditioner 10oz Duo",
    "Kevyn Aucoin The Etherealist Skin Illuminating Foundation",
    "Voluspa Japonica Classic Candle 9oz - Refill, Jasmine Midnight Blooms",
    "Epicuren Protein Mist Enzyme Toner, 4 OZ",
    "Matrix Style Fixer Hairspray",
    "Skin Gym WrinkLit LED Wireless Mask",
    "Kevyn Aucoin Sensual Skin Primer",
    "Sexy Hair Healthy SexyHair Tri-Wheat Leave In Conditioner",
    "Enjoy Volume Therapeutic Volumizing Shampoo, 32 OZ",
    "Guinot Creme Lift Summum",
    "Voluspa Maison Blanc Metallo 3 Wick Candle, Suede Blanc",
    "Jane Iredale CircleDelete Concealer, 3 - Gold Brown",
    "Matrix A Curl Can Dream Light Hold Gel",
    "Jane Iredale PureBrow Brow Gel, SOFT BLACK",
    "Denman D38 Power Paddle",
    "Bumble and bumble Bb.Curl Moisturizing Shampoo and Conditioner",
    "Peter Thomas Roth FIRMx Collagen Eye Cream",
    "BabylissPRO Nano Titanium Oval Ionic Hot Air Brush",
    "Scentered Aromatherapy Signature Ritual Collection 5-Piece Set",
    "Unite Blonda Oil",
    "PCA SKIN Nutrient Toner",
    "Color Wow Color Security Conditioner for Fine/Normal Hair, 8.4 OZ",
    "Natura Bisse NB Ceutical Tolerance Recovery Cream",
    "Kevyn Aucoin The Neo-Highlighter - Sahara (small pan)",
    "Jane Iredale Amazing Matte Loose Finish Powder",
    "DevaCurl Buildup Buster, 8 OZ",
    "Matrix Build A Bond Mask",
    "Joico Anti-Fade Colorful Shampoo, 33OZ",
    "bareMinerals Complexion Rescue Blonzer, Kiss of Rose",
    "Kenra Professional Platinum Luxe Shine Oil - 1.5oz",
    "Voluspa Japonica Collection Boxed Classic Candle 9 oz., Foraged Plum",
    "Colure Super Luxe Conditioner, 10.OZ",
    "Philip B Weightless Volumizing Shampoo, 7.4OZ",
    "The Art of Shaving After-Shave Balm, LAVENDER",
    "Davines This Is A Shimmering Mist",
    "Redken All Soft Shampoo and Conditioner Liter ($104 Value)",
    "Youngblood Hydrating Liquid Lip Crème, ICONIC",
    "Kiehl's Powerful Strength Line Reducing Concentrate",
    "Skin Gym Mouth Tape",
    "Redken Extreme Hair Mask 8.5oz",
    "Paul Mitchell Forever Blonde Shampoo, 8.5OZ",
    "Kiehl's Midnight Recovery Eye",
    "Rodial Dragons Blood Sculpting Gel",
    "Jack Henry Hair Foam",
    "Smashbox Always On Adaptive Balancing Foundation, F30N",
    "Matrix Brass Off Shampoo, 32 OZ",
    "Tweezerman Slant Tweezer, 1256 Onyx",
    "bareMinerals Complexion Rescue Tinted Moisturizer SPF 30, CASHMERE 02",
    "I.C.O.N. Awake Conditioner, 33.8OZ",
    "Unite 7 Seconds Masque",
    "Dr. Dennis Gross Alpha Beta Pore Perfecting & Refining Serum",
    "beautyblender Surface Simple Makeup Mixing Palette",
    "Jane Iredale Eye Shadow Kit - Naturally Matte",
    "Undercover Dreams Light Fragrance",
    "Voluspa Japonica Small Jar Candle 5.5oz, SANTAL VANILLE",
    "Sexy Hair Style SexyHair Polished Up Pomade",
    "Voluspa Japonica Lux Jar Candle - 44oz, French Cade Lavender",
    "Gentlemen Republic Stiff Pomade, 4OZ",
    "Fresh Rose Face Cream 1.6oz",
    "Kenra Professional Platinum Blow Dry Spray - 6.8oz",
    "Jane Iredale Liquid Eyeliner",
    "Pure Fiji Body Butter, Mango",
    "Smashbox Halo Healthy Glow Tinted Moisturizer Broad Spectrum SPF 25",
    "Infuse Yerba Mate Radiance Eye Cream",
    "Jane Iredale ColorLuxe Hydrating Cream Lipstick, TOFFEE",
    "Voluspa Blanc Lux Candle 30 oz ~ burn time 80hrs, Mountain Laurel",
    "Davines OI Shampoo",
    "Enjoy Repair Hair Mask, 32 OZ",
    "Wella Oil Reflections Light Luminous Reflective Oil - 3.3oz",
    "Bumble and Bumble Seaweed Whipped Scalp Scrub, 2OZ",
    "BabylissPRO Nano Titanium Limited Edition Black & Blue Professional Ionic Flat Iron",
    "Voluspa Japonica Lux Jar Candle - 44oz, FORBIDDEN FIG",
    "Mizani True Textures Perfect Coil Oil Gel",
    "bareMinerals Mineralist Lasting Eyeliner, AQUAMARINE",
    "Rodial Dragon's Blood Micellar Cleansing Water, 10.OZ",
    "Philip B Russian Amber Imperial Mousse",
    "Colure Strong Hold Finishing Spray",
    "Enjoy Style Protect and Shine",
    "Rene Furterer ASTERA FRESH Soothing Freshness Shampoo, 6.7OZ",
    "Kai Body Lotion",
    "Virtue Curl Shampoo - 8oz",
    "Smashbox Halo Plump + Glow Lip Gloss, Aura",
    "Colorproof Smooth Shampoo, 32OZ",
    "Redken Color Extend Magnetics Shampoo and Conditioner Duo 10oz",
    "bareMinerals Complexion Rescue Natural Matte Tinted Moisturizer SPF 30, MAHOGANY",
    "Bodela Unakite Essential Oil Bracelet",
    "Dr. Dennis Gross All Physical Ultimate Defense Broad Spectrum SPF 50",
    "Guinot Hydra Demaquillant Yeux Gentle Eye Cleansing Gel",
    "Satin Professional Hair Color, 8N Light Blonde",
    "Jane Iredale Skin Accumax, 120CT",
    "L'Oreal Serie Expert Curl Expression Anti-Build Up Cleansing Shampoo",
    "Olivia Garden Ceramic + Ion Supreme Combo Oval Paddle Brush",
    "Colorproof Daily Blonde Conditioner",
    "Matrix Biolage Bond Therapy Sulfate-Free Shampoo, 13.5 OZ",
    "DevaCurl CurlBond Re-Coiling Treatment Mask, 17OZ",
    "Layrite Natural Matte Cream 4oz",
    "Frankie Rose Matte Perfection Foundation, OLIVE",
    "Matrix Mega Sleek Conditioner, 32 OZ",
    "Guinot Hydrazone Moisturizing Rich Cream - Dehydrated Skin",
    "Ava Haircare Curl Conditoner",
    "Amika Blowout Babe Thermal Brush",
    "bareMinerals Loose Mineral Eyecolor, BARE SKIN",
    "Cinema Secrets Professional Grade Makeup Brush Cleaner Quick Drying Spray",
    "Jane Iredale PurePressed Base Mineral Foundation REFILL, GOLDEN GLOW",
    "Joico Moisture Recovery Conditioner, 33",
    "Joico HydraSplash Hydrating Gelee Masque",
    "Jane Iredale Beyond Matte Lip Stain, Temptation",
    "Wella Ultimate Smooth Conditioner 6.7oz, 33.8OZ",
    "Paul Mitchell Mitch Matterial Clay",
    "Wella Elements Renewing Shampoo Pouch - 33oz",
    "Olivia Garden Ceramic + Ion Thermal Round Brush, CI-35",
    "Peter Thomas Roth Max Clear Invisible Priming Sunscreen Broad Spectrum SPF 45",
    "Colure Body Volume Conditioner - 10oz",
    "Satin 30 Volume Developer, 6OZ",
    "Amika The Kure Repair Shampoo, 9.2OZ",
    "Davines Dede Leave-In Mist",
    "Alterna Caviar Anti-Aging Replenishing Moisture CC Cream, 5.1OZ",
    "Voluspa Maison Blanc Petite Glass Jar Candle with Lid, Saijo Persimmon",
    "Colorproof Single Gold/Silver Liter Pump",
    "Beauty Ora Facial Microneedle Roller System 0.25mm - Aqua Black",
    "Keratin Complex Blondeshell Debrass & Brighten Conditioner, 13 oz",
    "Frankie Rose Our lil' Secret Concealer, TOFFEE",
    "Rene Furterer VOLUMEA Volumizing Conditioning Spray - 4oz",
    "bareMinerals Complexion Rescue Tinted Moisturizer SPF 30, CINNAMON 10.5",
    "Amika Bust Your Brass Cool Blonde Shampoo, 9.2OZ",
    "Rilastil Daily Care Exfoliating Face Cream",
    "Wella Fusion Intense Repair Mask, 5.7OZ",
    "HealthyLine Rainbow Chakra Mat Small 4020 Firm - Photon PEMF Inframat Pro 3rd Edition",
    "Mizani 25 Miracle Nourishing Hair Oil",

    // --- Category/List Queries (Simple) ---
    "ractured query detected, resuming from line 67...",
    "hydrating serums",
    "vegan shampoo",
    "sunscreens",
    "best selling moisturizers",
    "show me lipsticks",
    "face masks",
    "conditioners for dry hair",

    // --- Category/List Queries (With Attributes) ---
    "hydrating serum for sensitive skin",
    "oil-free moisturizer for acne prone skin",
    "sulfate-free shampoo for color treated hair",
    "vegan lipsticks under $25", // Price constraint (AI might mention it, search won't filter yet)
    "mineral sunscreen SPF 50",
    "anti-aging eye cream with retinol",
    "gentle cleanser for dry skin",
    "volumizing mousse without alcohol",
    "brightening vitamin C serum",

    // --- Brand Specific List Queries ---
    "top Pureology products",
    "show me Elta MD sunscreens",
    "Olaplex treatments",
    "new arrivals from BeautyBrand", // Fictional brand from mock data
    "list ClearSkin Co acne products", // Fictional brand

    // --- How-To / Routine Queries ---
    "how to apply foundation",
    "skincare routine for oily skin",
    "how to use retinol serum",
    "what order should I apply skincare products?",
    "combination of products to fix dry skin", // Similar to original example
    "how to use the Pore Tightening Set", // Referring to a potential product name
    "morning routine for combination skin",
    "how to cover dark circles with makeup",

    // --- Problem/Goal Oriented Queries ---
    "products to help with acne",
    "I need something for dark spots",
    "my hair is very dry and damaged",
    "help me find products for redness",
    "looking for something to make my pores smaller",
    "best products for anti-aging",

    // --- Vague Queries (Test Fallback/Clarification) ---
    "find me something good",
    "I need help",
    "recommend a product",
    "what should I buy?",

    // --- Queries similar to User's JSON Example ---
    "I need product that can fix my acne pores, a set or combo of products with how to use pore tightening set",
    "I need product that can fix my acne pores, a set or combo of products with how to use acne treatment combo",
    "I need product that can fix my acne pores, a set or combo of products with how to use acne spot treatment",
    "I need product that can fix my acne pores, a set or combo of products with how to use acne pore cream",
    "I need product that can fix my acne pores, a set or combo of products with how to use acne pore cleanser",
    "I need product that can fix my acne pores, a set or combo of products with how to use pore minimizing serum",
    "I need product that can fix my acne pores, a set or combo of products with how to use pore refining toner",

    // --- Edge Cases / Complex ---
    "Compare Olaplex No 3 and K18 mask", // Comparison (AI might handle textually)
    "Is the Elta MD UV Clear good for rosacea?", // Specific question about a product attribute
    "Find a hydrating serum BUT NOT from The Ordinary", // Negative constraint (AI might handle)
];