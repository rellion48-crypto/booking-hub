-- 테스트 데이터 추가
INSERT INTO bookings (customer, kind, form, memo, date, address, slots_wanted, decision, status, service, email, via)
VALUES
  ('한솔전자', '서울', '외근', '미팅', '2026-09-08', '강남역', '오전', 'pending', 'pending', '미팅', 'test@test.com', 'form'),
  ('판교전자', '경기', '외근', '기획회의', '2026-09-08', '성남', '오후-1', 'pending', 'pending', '기획회의', 'test@test.com', 'form'),
  ('부산물산', '지방', '외근', '영업미팅', '2026-09-08', '부산', '오전', 'pending', 'pending', '영업미팅', 'test@test.com', 'form'),
  ('우리 팀', '내부', '온라인', '스크럼', '2026-09-08', '', '오전', 'pending', 'pending', '스크럼', 'test@test.com', 'form'),
  ('미래기획', '서울', '외근', '컨설팅', '2026-09-09', '여의도', '오후-2', 'pending', 'pending', '컨설팅', 'test@test.com', 'form'),
  ('광진미디어', '서울', '외근', '마케팅회의', '2026-09-09', '강남', '오후-2', 'pending', 'pending', '마케팅회의', 'test@test.com', 'form'),
  ('미상상사', '없음', '외근', '첫문의', '2026-09-09', '', '오전', 'pending', 'pending', '첫문의', 'test@test.com', 'form');
