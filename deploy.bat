@echo off

rem 모든 변경사항을 Staging Area에 추가
git add .

rem 커밋 메시지 입력
git commit -m "Auto Deploy: %date% %time%"

rem 원격 저장소에 Push
git push

rem Firebase에 배포
firebase deploy

echo 🎉 배포 및 Git 푸시 완료!
pause