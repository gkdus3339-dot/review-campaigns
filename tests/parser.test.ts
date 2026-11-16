import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWinMessage } from "../src/lib/parser";
import { DEFAULT_PLATFORMS } from "../src/lib/types";

const opts = { today: "2026-11-13", platforms: DEFAULT_PLATFORMS };

test("레뷰: bracket labels, ranges without year, 만원 상당, multi-line guide", () => {
  const { fields } = parseWinMessage(
    `[레뷰] 캠페인 선정 안내
안녕하세요, 블로거님! [서울 마포] 연남동 파스타바 '오늘도파스타' 캠페인에 선정되셨습니다🎉

■ 제공내역 : 파스타 2종 + 음료 2잔 (5만원 상당)
■ 방문기간 : 11.15(토) ~ 11.30(일)
■ 리뷰 등록기간 : 11.16 ~ 12.07
■ 주소 : 서울 마포구 동교로 123 1층
■ 필수 키워드 : 연남동 파스타, 연남동 맛집, 홍대 데이트
■ 가이드
- 사진 15장 이상, 동영상 1개 필수
- 지도 첨부 필수

캠페인 상세 : https://www.revu.net/campaign/123456`,
    opts,
  );
  assert.equal(fields.platform, "레뷰");
  assert.equal(fields.business_name, "오늘도파스타");
  assert.equal(fields.offer, "파스타 2종 + 음료 2잔 (5만원 상당)");
  assert.equal(fields.amount, 50000);
  assert.equal(fields.visit_start, "2026-11-15");
  assert.equal(fields.visit_end, "2026-11-30");
  assert.equal(fields.deadline, "2026-12-07");
  assert.equal(fields.region, "서울 마포구 동교로 123 1층");
  assert.equal(fields.keywords, "연남동 파스타, 연남동 맛집, 홍대 데이트");
  assert.match(fields.guide ?? "", /사진 15장 이상/);
  assert.match(fields.guide ?? "", /지도 첨부/);
  assert.equal(fields.campaign_url, "https://www.revu.net/campaign/123456");
  assert.equal(fields.category, "맛집");
});

test("강남맛집: 캠페인명 with region bracket, full dates, 년월일, hashtags after ※", () => {
  const { fields } = parseWinMessage(
    `[강남맛집] 체험단 선정 안내
축하드립니다! 신청하신 캠페인에 선정되셨습니다.

캠페인명: [서울 강남] 스시오마카세 한결
제공: 디너 오마카세 2인 (18만원 상당)
체험 기간: 2026.11.14 ~ 2026.11.28
콘텐츠 등록 마감일: 2026년 12월 5일
업체 주소: 서울특별시 강남구 테헤란로 45길 12
※ 방문 전 반드시 업체에 전화 예약 후 방문해주세요.
※ 키워드: #강남오마카세 #역삼역맛집
http://xn--939au0g4vj8sq.net/cp/?id=98765`,
    opts,
  );
  assert.equal(fields.platform, "강남맛집");
  assert.equal(fields.business_name, "스시오마카세 한결");
  assert.equal(fields.offer, "디너 오마카세 2인 (18만원 상당)");
  assert.equal(fields.amount, 180000);
  assert.equal(fields.visit_start, "2026-11-14");
  assert.equal(fields.visit_end, "2026-11-28");
  assert.equal(fields.deadline, "2026-12-05");
  assert.equal(fields.region, "서울특별시 강남구 테헤란로 45길 12");
  assert.equal(fields.keywords, "강남오마카세, 역삼역맛집");
  assert.match(fields.guide ?? "", /전화 예약/);
  assert.equal(fields.campaign_url, "http://xn--939au0g4vj8sq.net/cp/?id=98765");
  assert.equal(fields.category, "맛집");
});

test("디너의여왕: slash dates crossing month, 50,000원, penalty amount ignored", () => {
  const { fields } = parseWinMessage(
    `디너의여왕 체험단에 선정되신 것을 축하드립니다.

- 업체명: 브런치카페 소소
- 제공 내역: 브런치 세트 2인 (50,000원)
- 방문 가능 기간: 11/18 ~ 12/1
- 리뷰 작성 기한: 방문 후 7일 이내, 최종 마감 12/8
- 지역: 경기 성남시 분당구
- 패널티: 미작성 시 30,000원 청구
https://dinnerqueen.net/taste/12345`,
    opts,
  );
  assert.equal(fields.platform, "디너의여왕");
  assert.equal(fields.business_name, "브런치카페 소소");
  assert.equal(fields.amount, 50000);
  assert.equal(fields.visit_start, "2026-11-18");
  assert.equal(fields.visit_end, "2026-12-01");
  assert.equal(fields.deadline, "2026-12-08");
  assert.equal(fields.region, "경기 성남시 분당구");
  assert.match(fields.guide ?? "", /미작성 시 30,000원 청구/);
  assert.equal(fields.category, "카페");
});

test("리뷰노트: delivered product, ISO deadline, 정가, count ranges are not dates", () => {
  const { fields } = parseWinMessage(
    `[리뷰노트] 당첨 안내
'퓨어글로우 비타민C 세럼' 캠페인에 당첨되셨습니다.
제공 상품 : 비타민C 세럼 30ml 1개 (정가 32,000원)
배송 : 영업일 기준 3~5일 내 발송
리뷰 마감 : 2026-11-30
필수 키워드 : 비타민세럼, 미백세럼
https://www.reviewnote.co.kr/campaigns/55555`,
    opts,
  );
  assert.equal(fields.platform, "리뷰노트");
  assert.equal(fields.business_name, "퓨어글로우 비타민C 세럼");
  assert.equal(fields.offer, "비타민C 세럼 30ml 1개 (정가 32,000원)");
  assert.equal(fields.amount, 32000);
  assert.equal(fields.deadline, "2026-11-30");
  assert.equal(fields.visit_start, undefined);
  assert.equal(fields.visit_end, undefined);
  assert.equal(fields.keywords, "비타민세럼, 미백세럼");
  assert.equal(fields.category, "제품");
});

test("SMS without platform: 「」 name, reservation date, 까지 deadline, phone kept", () => {
  const { fields } = parseWinMessage(
    `[Web발신]
(광고) 체험단 당첨 안내
고객님, 「한옥스테이 담」 숙박 체험단에 선정되셨습니다.
1박 숙박권 제공 (15만원 상당)
예약일: 12월 6일(토) 15시 체크인
포스팅 마감: 12월 20일까지
문의 010-1234-5678`,
    opts,
  );
  assert.equal(fields.platform, undefined);
  assert.equal(fields.business_name, "한옥스테이 담");
  assert.equal(fields.amount, 150000);
  assert.equal(fields.offer, "1박 숙박권 제공 (15만원 상당)");
  assert.equal(fields.visit_date, "2026-12-06");
  assert.equal(fields.deadline, "2026-12-20");
  assert.equal(fields.status, "방문 예정");
  assert.equal(fields.category, "숙박");
  assert.equal(fields.phone, "010-1234-5678");
  assert.equal(fields.visit_time_start, undefined);
  assert.equal(fields.visit_time_end, undefined);
});

test("free-form sentences: 부터/까지 range, 2인 식사권 6만원", () => {
  const { fields } = parseWinMessage(
    `축하합니다! 미블 체험단 '을지로 노포 곱창' 선정
방문은 11월 20일부터 12월 3일까지 가능하며
리뷰는 방문 후 12월 10일까지 등록해주세요.
2인 식사권 6만원`,
    opts,
  );
  assert.equal(fields.platform, "미블");
  assert.equal(fields.business_name, "을지로 노포 곱창");
  assert.equal(fields.visit_start, "2026-11-20");
  assert.equal(fields.visit_end, "2026-12-03");
  assert.equal(fields.deadline, "2026-12-10");
  assert.equal(fields.amount, 60000);
  assert.equal(fields.offer, "2인 식사권 6만원");
  assert.equal(fields.category, "맛집");
});

test("next-year inference, same-month day-only range, label on its own line", () => {
  const { fields } = parseWinMessage(
    `[레뷰] [부산 해운대] 오션뷰 네일살롱 체험단 선정
제공내역
젤네일 풀세트 1회 (7만 원 상당)
방문기간: 1.5~20
리뷰마감: 1/27`,
    { today: "2026-12-28", platforms: DEFAULT_PLATFORMS },
  );
  assert.equal(fields.platform, "레뷰");
  assert.equal(fields.business_name, "오션뷰 네일살롱");
  assert.equal(fields.offer, "젤네일 풀세트 1회 (7만 원 상당)");
  assert.equal(fields.amount, 70000);
  assert.equal(fields.visit_start, "2027-01-05");
  assert.equal(fields.visit_end, "2027-01-20");
  assert.equal(fields.deadline, "2027-01-27");
  assert.equal(fields.region, "부산 해운대");
  assert.equal(fields.category, "뷰티");
});

test("custom platform from the user's list and 3만5천원", () => {
  const { fields } = parseWinMessage(
    `포블로그 체험단 당첨!
업체명: 동네책방 카페
제공: 음료 2잔 + 디저트 (3만5천원 상당)
방문 기간 ~11/25`,
    { today: "2026-11-13", platforms: [...DEFAULT_PLATFORMS, "포블로그"] },
  );
  assert.equal(fields.platform, "포블로그");
  assert.equal(fields.amount, 35000);
  assert.equal(fields.visit_start, undefined);
  assert.equal(fields.visit_end, "2026-11-25");
});

test("phone, visit hours, and the 미션 block stay intact", () => {
  const missionUrl = "https://maps.google.com/maps?q=today-pasta";
  const { fields } = parseWinMessage(
    `[레뷰] 오늘도파스타 체험단 선정
연락처: 010-9876-5432
방문 가능 시간: 11:00~15:00
방문기간: 11.15 ~ 11.30

미션
1. 제목에 '연남동 파스타'를 넣어 주세요
2. 사진은 15장 이상
3. 음식, 외관, 메뉴판을 찍어 주세요
4. 가격 비교나 허위 내용은 쓰지 마세요
5. 구글 지도 리뷰를 남겨 주세요 ${missionUrl}
6. 인스타그램 #오늘도파스타 #연남맛집 태그와 좋아요, 팔로우

https://www.revu.net/campaign/123456`,
    opts,
  );
  assert.equal(fields.platform, "레뷰");
  assert.equal(fields.phone, "010-9876-5432");
  assert.equal(fields.visit_time_start, "11:00");
  assert.equal(fields.visit_time_end, "15:00");
  assert.equal(fields.visit_start, "2026-11-15");
  assert.equal(fields.visit_end, "2026-11-30");
  assert.match(fields.mission ?? "", /1\. 제목에 '연남동 파스타'/);
  assert.match(fields.mission ?? "", /사진은 15장 이상/);
  assert.match(fields.mission ?? "", /음식, 외관, 메뉴판/);
  assert.match(fields.mission ?? "", /쓰지 마세요/);
  assert.match(fields.mission ?? "", new RegExp(missionUrl.replace(/[?]/g, "\\?")));
  assert.match(fields.mission ?? "", /#오늘도파스타 #연남맛집/);
  assert.match(fields.mission ?? "", /좋아요, 팔로우/);
  assert.equal(fields.mission?.includes("revu.net"), false);
  assert.equal(fields.campaign_url, "https://www.revu.net/campaign/123456");
});

test("visit hours without a colon and a numbered guide without a 미션 heading", () => {
  const { fields } = parseWinMessage(
    `디너의여왕 체험단 선정
업체명: 브런치카페 소소
방문 가능 시간 11시~3시
1. 제목 키워드를 지켜 주세요
2. 인스타 태그 후 좋아요와 팔로우
https://dinnerqueen.net/taste/12345`,
    opts,
  );
  assert.equal(fields.platform, "디너의여왕");
  assert.equal(fields.visit_time_start, "11:00");
  assert.equal(fields.visit_time_end, "15:00");
  assert.match(fields.mission ?? "", /^1\. 제목 키워드/);
  assert.match(fields.mission ?? "", /2\. 인스타 태그 후 좋아요와 팔로우/);
});

test("링블 win message keeps the talk link, hours, deadline, and mission text", () => {
  const message = `[링블 당첨자 발표 안내]

축하드립니다!

김하연님이 신청하신 [블로그] [서울/마포구] 홍대향수공방 닷노트[서울/마포구] 홍대향수공방 닷노트에 선정되셨습니다.
https://www.ringble.co.kr/detail.php?number=285524

<안내사항>
- 제공내역 : 위 링크 참조
- 리뷰 마감 기한 : ~11.27(금) 까지
- 방문가능시간 : 평일, 주말 11:00 ~ 20:00 에만 방문 가능 / 공휴일 방문 불가
- 위치 : 서울 마포구 신촌로4길 14, 2층 닷노트
★당첨일로부터 1~2일 안에 업체와 예약 조율 필수★
※ 예약 문의 : 네이버톡톡 https://talk.naver.com/W5TNNQ
※ 네이버 예약 후 페이백으로 진행됩니다. 리뷰 작성 후 업체 안내에 따라 제공된 환급 신청서를 제출하세요.

<필독사항>
당일 취소하거나 사전에 연락없이 방문하지 않는 경우, 추후 사이트 이용 제한 및 당첨자 선정에서 제외될 수 있습니다.

<리뷰작성안내>
- 후기 작성 가이드(링크페이지 참조) 확인 후 작성을 해주세요.
- 후기 작성 후 반드시 링블 사이트에 등록해주세요!
※ 로그인 > 마이페이지 > 리뷰등록하기

★ 안내받으신 방법으로 업체 방문일 예약 후, 확정일을 [로그인- 마이페이지- 신청한 체험단] 에 기입해주세요`;
  const page = `모집 기간 26년 11월 04일(수) ~ 26년 11월 10일(화) 리뷰 등록 기간 26년 11월 12일(목) ~ 26년 11월 27일(금) 제공내역.NOTE 원데이 클래스 50ml (10만원 상당) 유의사항 ※ 최대 2인까지 방문 가능 리뷰어 미션 필수 키워드: 서울 홍대 향수공방 위 키워드를 제목에는 1회, 본문에는 5회 이상 넣어주세요. ※ 키워드 미션이 지켜지지 않을 경우 수정요청될 수 있습니다. 1.리뷰 제목에는 매장명(닷노트)을 반드시 적어주세요. 2.사진은 15장 이상 첨부해주세요. - (필수) 향수병과 롤온패키지를 각각 따로 찍은 사진 3. 강의 내용 자세한 소개 X 6. (필수) 구글 지도 리뷰 작성 : https://maps.app.goo.gl/x9QYwP3zJgocMLFg6 7. @dotnote.perfume 인스타 팔로우 해주세요 8. @dotnote.perfume 인스타 게시물 중 5개를 선택하여 '좋아요'를 눌러주세요. 1. 별도의 사유 없이 리뷰등록기간 내 리뷰를 작성하지 않을 경우 포인트 차감과 비용이 청구될 수 있습니다. 사업자 등록번호 : 863-81-01942`;
  const today = { today: "2026-11-16", platforms: DEFAULT_PLATFORMS };
  const messageOnly = parseWinMessage(message, today).fields;
  assert.equal(messageOnly.platform, "링블");
  assert.equal(messageOnly.business_name, "홍대향수공방 닷노트");
  assert.equal(messageOnly.offer, "위 링크 참조");
  assert.equal(messageOnly.amount, undefined);
  assert.equal(messageOnly.phone, "https://talk.naver.com/W5TNNQ");
  assert.equal(messageOnly.visit_time_start, "11:00");
  assert.equal(messageOnly.visit_time_end, "20:00");
  assert.match(messageOnly.visit_time_note ?? "", /평일, 주말 11:00 ~ 20:00/);
  assert.match(messageOnly.visit_time_note ?? "", /공휴일 방문 불가/);
  assert.equal(messageOnly.visit_start, undefined);
  assert.equal(messageOnly.visit_end, undefined);
  assert.equal(messageOnly.visit_date, undefined);
  assert.equal(messageOnly.deadline, "2026-11-27");
  assert.match(messageOnly.region ?? "", /신촌로4길 14/);
  assert.match(messageOnly.mission ?? "", /예약 조율 필수/);
  assert.match(messageOnly.mission ?? "", /https:\/\/talk\.naver\.com\/W5TNNQ/);
  assert.match(messageOnly.mission ?? "", /필독사항/);
  assert.match(messageOnly.mission ?? "", /당일 취소하거나/);
  assert.match(messageOnly.mission ?? "", /리뷰작성안내/);
  assert.match(messageOnly.mission ?? "", /링크페이지 참조/);
  assert.match(messageOnly.mission ?? "", /마이페이지/);
  assert.match(messageOnly.mission ?? "", /신청한 체험단/);

  const { fields } = parseWinMessage(message, { ...today, pages: [{ url: "https://www.ringble.co.kr/detail.php?number=285524", text: page }] });
  assert.equal(fields.platform, "링블");
  assert.equal(fields.offer, ".NOTE 원데이 클래스 50ml (10만원 상당)");
  assert.equal(fields.amount, 100000);
  assert.equal(fields.phone, "https://talk.naver.com/W5TNNQ");
  assert.equal(fields.keywords, "서울 홍대 향수공방");
  assert.equal(fields.visit_start, undefined);
  assert.equal(fields.visit_end, undefined);
  assert.equal(fields.deadline, "2026-11-27");
  assert.match(fields.visit_time_note ?? "", /공휴일 방문 불가/);
  assert.match(fields.mission ?? "", /https:\/\/talk\.naver\.com\/W5TNNQ/);
  assert.match(fields.mission ?? "", /필독사항/);
  assert.match(fields.mission ?? "", /매장명\(닷노트\)/);
  assert.match(fields.mission ?? "", /15장 이상/);
  assert.match(fields.mission ?? "", /리뷰등록기간 내/);
  assert.equal(fields.mission?.includes("리뷰등록기간:"), false);
  assert.match(fields.mission ?? "", /향수병과 롤온패키지/);
  assert.match(fields.mission ?? "", /https:\/\/maps\.app\.goo\.gl\/x9QYwP3zJgocMLFg6/);
  assert.match(fields.mission ?? "", /인스타 팔로우/);
  assert.match(fields.mission ?? "", /좋아요/);
  assert.equal(fields.mission?.includes("863-81-01942"), false);
});

test("empty or unrelated text yields nothing harmful", () => {
  assert.deepEqual(parseWinMessage("", opts).fields, {});
  const { fields } = parseWinMessage("오늘 날씨가 좋네요", opts);
  assert.equal(fields.amount, undefined);
  assert.equal(fields.deadline, undefined);
});
