FROM node:16
RUN mkdir -p /home/myKoaManagerBackEnd
WORKDIR /home/myKoaManagerBackEnd
COPY . /home/myKoaManagerBackEnd
RUN npm install
EXPOSE 3000
CMD npm run 'prd'
