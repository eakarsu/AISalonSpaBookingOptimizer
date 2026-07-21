const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path:require('path').join(__dirname,'../.env') });

const auth = require('./middleware/auth');
const { validateRuntime } = require('./governance/runtime');
const { createProviderGate } = require('./governance/providerGate');

validateRuntime();

const app=express();
const PORT=process.env.BACKEND_PORT||3001;
const origins=String(process.env.CORS_ORIGINS||process.env.CLIENT_URL||'http://localhost:3000').split(',').map((value)=>value.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({origin(origin,callback){if(!origin||origins.includes(origin))return callback(null,true);return callback(new Error('CORS origin denied'));},credentials:true}));
app.use(express.json({limit:'1mb'}));
app.use('/api/auth',require('./routes/auth'));
app.get('/api/health',(_req,res)=>res.json({status:'ok',timestamp:new Date().toISOString()}));
app.use(createProviderGate(['/api/ai','/api/gap']));
app.use('/api/governed-bookings',require('./governance/router'));
app.use('/api',auth);

for(const [route,moduleName] of [
  ['/api/stylists','stylists'],['/api/services','services'],['/api/clients','clients'],['/api/bookings','bookings'],
  ['/api/products','products'],['/api/waitlist','waitlist'],['/api/schedules','schedules'],['/api/reviews','reviews'],
  ['/api/promotions','promotions'],['/api/inventory','inventory'],['/api/loyalty','loyalty'],['/api/reports','reports'],
  ['/api/giftcards','giftcards'],['/api/expenses','expenses'],['/api/communications','communications'],
  ['/api/performance','performance'],['/api/tips','tips'],['/api/checkin','checkin'],['/api/memberships','memberships'],
  ['/api/suppliers','suppliers'],['/api/payroll','payroll'],
]) app.use(route,require(`./routes/${moduleName}`));

if(process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP==='true'){
  require('./migrate')().catch((error)=>console.error('Legacy schema bootstrap failed:',error.message));
}
if(process.env.ENABLE_LEGACY_PROVIDER_ROUTES==='true'){
  app.use('/api/ai',require('./routes/ai'));
  app.use('/api/ai/service-bundling',require('./routes/ai-service-bundling'));
  app.use('/api/gap-no-servicedemandforecast-busytime-prediction',require('./routes/gap-no-servicedemandforecast-busytime-prediction'));
  app.use('/api/gap-no-stylistworkloadbalance',require('./routes/gap-no-stylistworkloadbalance'));
  app.use('/api/gap-no-commissionoptimization',require('./routes/gap-no-commissionoptimization'));
  app.use('/api/gap-no-retailrecommend-product-to-add-to-service',require('./routes/gap-no-retailrecommend-product-to-add-to-service'));
  app.use('/api/gap-no-appointmentconflictdetection',require('./routes/gap-no-appointmentconflictdetection'));
  app.use('/api/gap-no-noshow-prediction',require('./routes/gap-no-noshow-prediction'));
  app.use('/api/gap-no-public-online-booking-widget-api',require('./routes/gap-no-public-online-booking-widget-api'));
  app.use('/api/gap-no-automated-reminder-smsemail-communication',require('./routes/gap-no-automated-reminder-smsemail-communication'));
  app.use('/api/gap-no-supplier-reorder-automation',require('./routes/gap-no-supplier-reorder-automation'));
  app.use('/api/gap-no-staff-absence-coverage-planning',require('./routes/gap-no-staff-absence-coverage-planning'));
  app.use('/api/gap-no-payment-processor-integration',require('./routes/gap-no-payment-processor-integration'));
  app.use('/api/gap-no-pos-hardware-integration',require('./routes/gap-no-pos-hardware-integration'));
}
app.use((err,_req,res,_next)=>{console.error('Server error:',err.message);res.status(err.status||500).json({error:err.status?err.message:'Internal server error'});});
app.use((_req,res)=>res.status(404).json({error:'Route not found'}));
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
