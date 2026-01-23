<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate</title>
    <style>
        body {
            font-family: Georgia, serif;
            margin: 40px;
            padding: 0;
        }
        .certificate {
            border: 10px solid #28a745;
            padding: 40px;
            text-align: center;
        }
        .inner-border {
            border: 2px solid #ffd700;
            padding: 30px;
        }
        .logo {
            font-size: 24px;
            color: #28a745;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .title {
            font-size: 22px;
            color: #28a745;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #28a745;
        }
        .text {
            font-size: 14px;
            color: #555;
            margin: 15px 0;
        }
        .name {
            font-size: 30px;
            color: #000;
            font-weight: bold;
            margin: 20px 0;
            border-bottom: 2px solid #28a745;
            padding-bottom: 5px;
        }
        .course {
            font-size: 20px;
            color: #28a745;
            font-weight: bold;
            margin: 20px 0;
        }
        .seal {
            width: 60px;
            height: 60px;
            background: #28a745;
            border-radius: 50%;
            color: white;
            font-size: 9px;
            font-weight: bold;
            padding-top: 20px;
            margin: 20px auto;
        }
        .footer {
            margin-top: 30px;
        }
        .signature {
            width: 45%;
            display: inline-block;
            margin: 0 2%;
            border-top: 2px solid #333;
            padding-top: 5px;
        }
        .sig-name {
            font-size: 12px;
            font-weight: bold;
            color: #333;
        }
        .sig-title {
            font-size: 10px;
            color: #666;
        }
        .code {
            font-size: 9px;
            color: #888;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="inner-border">
            <div class="logo">🎓 LearnQuest</div>
            <div class="title">Certificate of Completion</div>
            <p class="text">This certificate is proudly awarded to</p>
            <div class="name">{{ $student_name }}</div>
            <p class="text">For successfully completing the course</p>
            <div class="course">{{ $course_title }}</div>
            <div class="seal">VERIFIED<br>{{ date('Y', strtotime($issued_date)) }}</div>
            <div class="footer">
                <div class="signature">
                    <div class="sig-name">{{ $instructor_name }}</div>
                    <div class="sig-title">Course Instructor</div>
                </div>
                <div class="signature">
                    <div class="sig-name">{{ $issued_date }}</div>
                    <div class="sig-title">Date of Completion</div>
                </div>
            </div>
            <div class="code">Certificate Code: {{ $certificate_code }}</div>
        </div>
    </div>
</body>
</html>
