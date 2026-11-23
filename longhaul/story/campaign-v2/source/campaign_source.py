"""Editorial source, edition 2. Dialogue is authored here, never generated from templates."""
TITLE = 'Long Haul - The Way Back'
EDITION = '2.0 / 22 November 2026'
CAST = {
 'CAL': ('Callum Reed / Cal','Men','26; 15-21 in prologue','Grounded mid register. Aroace. Humor is dry; anxiety interrupts breath rather than raising every line. His attachment to Grevyn is platonic. Own his service complicity. Never play depression as laziness.'),
 'GREVYN': ('Grevyn','Women','26; 15-21 in prologue','Intelligent, once playful, later guarded. Mark three states: lucid self, conditioned certainty, supernatural intrusion. These are directed states, not a caricature of mental illness. Pain remains after powers lift her.'),
 'RIPED': ('Riped','Men','26; 15-21 in prologue','Fast, cocky, always supplying an answer. Humor evades accountability. Small silences expose calculation. Jealous of emotional closeness, not entitled to romance. Final confession is cruelly matter-of-fact.'),
 'TAY': ('Tayla / Tay','Women','26; 15-21 in prologue','Warm, protective field medic. Practical boundaries and anger as well as comfort. Cal is her friend, not her entire life. Trusts Riped until evidence changes her mind.'),
 'TAYJ': ('TayJay / TayJ','Women','26; 15-21 in prologue','Observant radio operator and navigator. Precise, understated wit. Challenges Riped openly. Slow down for evidence, coordinates and warnings; do not sound like a quest menu.'),
 'ROAD': ('The Road Force','Women','Ageless; adult voice','Intimate, tired, steady. A separate benevolent but culpable entity. No imitation of dead people. Processing is optional and must preserve words. Each physical intervention costs it strength.'),
 'EVIL': ('The Dominion / Evil Force','Men','Ageless; adult voice','Working production name: Dominion. Quiet authority that feeds on obedience and fear. More frightening as an instruction than a roar. Never confuse with Road Force.'),
 'GUCKI': ('Grandpa Gucki','Men','Approximately 74','Publicly paternal regime leader, privately transactional. Chooses to damage the force to reclaim power, not because victims owe him redemption.'),
 'SABLE': ('Dr. Sable Nadir','Women','41','Captive biochemist, blunt and careful. Interprets Grevyn\'s fictional research; gives clear choices without promising impossible cures. New supporting role.'),
 'NESS': ('Ness Arlen','Women','34','Settlement steward. Compassion with a ledger and limits. People are never props for Cal\'s rescue. New supporting role.'),
 'DAIN': ('Dain Mercer','Men','38','Convoy mechanic. Wry, resourceful, understands a repair through its sound. Will disagree with reckless orders. New supporting role.'),
 'VOSS': ('Commander Voss','Men','46','Gucki Trooper detention commander. Procedural intimidation; little shouting. Authorizes Riped\'s release and the staged cell breach. New supporting role.'),
 'MERRIN': ('Merrin Holt','Women','53','Former resistance leader, genuine early ideals corrupted by deliberate experiments. Regret is neither innocence nor automatic forgiveness. New supporting role.'),
 'ORIN': ('Orin Bell','Men','62 in 2096; 51 in 2085','History teacher heard in school, later an archive survivor. Encourages corroboration; regrets not protecting pupils. New supporting role.'),
 'LIO': ('Lio','Men','21 in 2091','Adult civilian colleague. Brief sincere flirt, immediately respects a no. New supporting role.'),
 'JESS': ('Jess','Women','21 in 2091','Adult supply clerk. Confident, friendly flirt, accepts Cal\'s boundary without debate. New supporting role.'),
}
MISSIONS=[]
def scene(title,stage,raw):
 lines=[]
 for row in raw.strip().splitlines():
  sp,direction,text=row.strip().split('|',2)
  assert sp in CAST,sp
  lines.append(dict(speaker=sp,direction=direction,text=text))
 return dict(title=title,stage=stage,lines=lines)
def mission(id,title,chapter,minutes,site,light,music,goal,steps,object_hint,choice,recovery,scenes):
 assert len(steps)==3
 m=dict(id=id,title=title,chapter=chapter,minutes=minutes,site=site,light=light,music=music,goal=goal,steps=steps,object_hint=object_hint,choice=choice,recovery=recovery,scenes=scenes)
 for i,s in enumerate(scenes):
  s['id']=f'{id}.{chr(65+i)}'
  for j,l in enumerate(s['lines']): l['id']=f'LH2-{id}-{chr(65+i)}-{j+1:03}'
 MISSIONS.append(m)

mission('P01','The Window Seat','Prologue - Before the Dust',35,'school','SCHOOL','WINDOW',
 'Meet Grevyn in ninth-grade history; establish the whole friendship group through playable school memories.',
 [('Find the classroom','Read the timetable and sit beside the west window.'),('Build the friendship','Sort a disputed history source with Grevyn; leave class together.'),('Keep a place','Play the end-of-freshman and start-of-sophomore courtyard meetings.')],
 ('timetable','The room number is on the board beside the stairs.'),
 'Choose whether Cal first admits being lost or jokes about the map. Both establish friendship; no romance score.',
 'Missed school interactions remain in the memory journal; no timed dialogue failure.',[
 scene('An empty chair','2085. Track fifteen-year-old Cal at walking speed down a sunlit corridor, 4 seconds, then cut over his shoulder to the timetable for 3 seconds. Return control before he chooses the desk. No school-age flirting.',
 '''ORIN|patient|A source can tell the truth about a date and lie about everything that date meant.
 GREVYN|quiet invitation|That seat is free. Unless you particularly enjoy standing under the clock.
 CAL|trying a joke|I was hoping the clock would tell me where I was supposed to be.
 GREVYN|amused|History. Bad news: most of the people in it were also lost.
 CAL|warming|Callum.
 GREVYN|simple|Grevyn. Put your book here before someone decides we need separating.
 ORIN|to class|Compare the two accounts. Tell me whose name disappeared between drafts.
 CAL|to Grevyn|You noticed that before he asked.
 GREVYN|unimpressed by authority|They made the missing bit bigger than the rest.'''),
 scene('Near the end of freshman year','Late spring 2086, school courtyard. Follow the pair along the shaded wall. Frame Tay and TayJ in the same wide shot, not as introductions through a menu. Riped enters from behind Cal and talks over him.',
 '''TAY|offering a bottle|You two missed lunch again. Water first, world history second.
 TAYJ|looking up from a notebook|I wrote down what you missed. Mostly Riped explaining my own radio project to me.
 RIPED|grinning|Improving it. There is a difference.
 CAL|flat affection wearing thin|There really is. She asked you to stop improving it.
 GREVYN|to Cal|Tomorrow, save me the window seat?
 CAL|easy|Already yours.
 RIPED|light, too quick|Amazing. An exclusive seating arrangement.
 TAY|defusing without dismissing|There are five of us and a whole bench. Move your bag.'''),
 scene('Sophomore morning','2086 autumn. Repeat the classroom composition with older clothes and cooler daylight. An optional look at the class photograph names the five friends. Hold Grevyn and Cal in a plain two-shot; this is friendship, not romantic visual shorthand.',
 '''GREVYN|comfortable|Cal. You actually got here before me.
 CAL|mock solemn|A historic event. We should compare two sources.
 TAYJ|joining them|Source one says you were asleep on the bus.
 TAY|laughing|Source two had to wake him up.
 RIPED|claiming the moment|I told the driver where to stop. You are all welcome.
 ORIN|entering|Keep the jokes. Keep your questions, too. You will need both.
 GREVYN|low, sincere|Promise me we do not become people who stop asking.
 CAL|sincere|You have permission to be unbearable if I do.''')])

mission('P02','In Service','Prologue - Before the Dust',50,'depot','SERVICE','UNIFORM',
 'Play graduation in 2089 and service in 2091; establish Cal\'s aroace identity and the trio\'s complicity.',
 [('Sign on','Leave graduation, inspect the recruitment contract, enter the two-year service transition.'),('Follow the assignment','Escort a civilian transport; notice the discrepancy between its label and prisoners.'),('Keep the record','Copy the unredacted transfer ledger rather than destroy it.')],
 ('ledger','The transport numbers do not match the public order.'),
 'Cal can initially comply or challenge Voss; both leave responsibility for his earlier work, and the ledger is mandatory evidence.',
 'A civilian escort cannot be harmed for rewards; if a transport jams, restore its last safe stop.',[
 scene('After graduation','2089. Graduation group photograph becomes a matched cut to service badges in 2091. Dolly behind Cal, Grevyn and Riped through depot gates for 5 seconds. Stop on a detention van without lingering on suffering.',
 '''CAL|remembering the contract|Public logistics. Road protection. That was what the leaflet said.
 GREVYN|watching the van|It did not say why road protection needs blacked-out windows.
 RIPED|casual|Because people throw stones. You both make everything a conspiracy.
 VOSS|official|Reed, Grevyn, Riped. Escort transport twelve. No unscheduled contact.
 CAL|careful|The order says medical relocation. Where is the medical officer?
 VOSS|cold|Your duty is the road. The manifest is above your clearance.
 GREVYN|to Cal, low|You signed yesterday\'s transfer, too?
 CAL|ashamed|Yes. I did.'''),
 scene('A clear answer','2091. Adult staff canteen between assignments. Gameplay conversation with Lio, then Jess at the supply window. Cal is approximately twenty-one; both NPCs are adults. No rejection gag, negative relationship point or romance unlock.',
 '''LIO|friendly flirt|When your shift ends, would you want dinner? As a date, I mean.
 CAL|kind, certain|Thanks, but no. I am aroace. I do not want dates or a partner.
 LIO|accepting|Understood. Spare chair at lunch still counts as friendship, though.
 CAL|relieved|That sounds good.
 JESS|later, playful|Then I should retire my very impressive attempt to ask you out?
 CAL|warm boundary|Retire it with honors. Friends is the offer I can make honestly.
 JESS|good humor|Friends it is. And you still owe stores a working torch.
 GREVYN|after they leave|People keep treating a close friend like an unfinished relationship.
 CAL|easy confidence|Ours is finished being exactly what it is. That is plenty.
 GREVYN|fond|Good. Because I am keeping the window seat.'''),
 scene('What we signed','Service archive. Focus on Cal\'s signature, then the changed detention destination. No forced confession choice: player handles the ledger and sees his role directly. A rear tracking shot follows Grevyn shutting the office door.',
 '''GREVYN|containing anger|They are not moving people to clinics. They are moving witnesses where nobody can hear them.
 CAL|looking at his signature|I checked the vehicle weight. I never checked who was inside.
 GREVYN|firm|Then check now. And help me get this out.
 RIPED|entering without knocking|Careful. You make a copy, it becomes your problem.
 CAL|to Riped|It already is our problem.
 RIPED|shrugging|Fine. Hero paperwork. Just do not drag me into your little pact.
 GREVYN|to Cal once alone|I started digging. There is more than transport lists.
 CAL|quiet decision|Show me. All of it.''')])

mission('P03','Save Me the Window Seat','Prologue - Before the Dust',40,'school','ARCHIVE','WINDOW_DARK',
 'Help Grevyn secure whistleblower evidence; establish every private detail later used to frame Cal.',
 [('Secure originals','Place the torture and unlawful detention evidence behind the classroom map cabinet.'),('Arrange extraction','Mark Drywell Pump Station\'s western loading canopy and service-road approach.'),('Leave separately','Send a legitimate protective transport request and preserve its carbon copy.')],
 ('cabinet_panel','The map frame sits farther out from the wall on the left.'),
 'Choose compassionate or practical reassurance. The dangerous information is overheard in the same conversation in both paths.',
 'Do not display Riped\'s report to Cal in 2091; an audience-only shot establishes access without revealing the entire conspiracy.',[
 scene('Behind the map','2091, after hours. Follow Grevyn from corridor to map cabinet at 1.2 m/s for 6 seconds. Cut to her lifting its back panel, then to Cal\'s hand holding the originals. Riped\'s silhouette is visible beyond frosted glass only after the key details.',
 '''GREVYN|low|The originals go behind this panel. Same classroom. Same map they never updated.
 CAL|checking the papers|Names, orders, injury logs. This can prove what they did.
 GREVYN|afraid but exact|Not if we lose the originals. Not if they call every witness a liar.
 CAL|reassuring|I will keep a copy apart from yours.
 GREVYN|private code|If I say save me the window seat, I am in danger. I cannot speak freely.
 CAL|repeating deliberately|Save me the window seat. I come and get you.
 GREVYN|needing precision|Listen first. Coming blind gets both of us caught.
 CAL|accepting|Listen first. Then we get you out.'''),
 scene('The western canopy','Insert Grevyn\'s finger following the service road on a paper plan, 4 seconds, with Drywell\'s west canopy legible. Return to the doorway in a wide shot: Riped hears this in the same continuous encounter. No omniscient journal entry.',
 '''GREVYN|pointing|Drywell Pump Station. Western loading canopy. Not the front gates.
 CAL|checking|Service road, west side. Main entrance is watched.
 GREVYN|small tremor|I do not know who is still safe. I know I can tell you.
 CAL|quiet|You can.
 GREVYN|watching him|And do not write my name on a transport order.
 CAL|practical|Protective pickup, route only. I will keep the unedited form.
 RIPED|outside, covering his presence|There you are. Voss wants everybody accounted for.
 CAL|annoyed|Then tell him you found yourself. We are busy.'''),
 scene('Borrowed authority','Cal completes the genuine protective request at a shared service terminal, signs out, and exits. Follow him to the vehicle; cut back for 3 seconds to Riped beside the still-unlocked radio identity token. An existing handwritten civilian pickup note is on the desk.',
 '''RIPED|overfamiliar|You two always act like the rest of us are furniture.
 CAL|tired|You could try listening without making it a competition.
 RIPED|laughing it off|I listen. More than you think.
 TAYJ|radio|Cal, check your transmitter token before you leave. That desk shares a session.
 CAL|distracted|I have the paper copy. I will check at the vehicle.
 GREVYN|radio, coded urgency|Save me the window seat.
 CAL|immediate|I hear you. Stay off the main entrance.
 RIPED|too helpful|I know a faster pickup route. Follow me out.''')])

mission('P04','The Second Road','Prologue - Before the Dust',55,'drywell','EVAC','SECOND_ROAD',
 'Attempt both rescue routes during the 2091 collapse, survive the gunshot and play the final broken call.',
 [('Try the first route','Reach Riped\'s pickup approach; inspect the destroyed span and turn back.'),('Try the actual service road','Reach the blockade on the correct western approach; take the scripted wound and crawl to cover.'),('Survive and answer','Let Tay and TayJ extract Cal; play the last call and departure.')],
 ('service_turn','The western canopy is reached by the narrow service lane, not the gate.'),
 'Tactical approach changes dialogue, never whether Cal tried. The scripted shot cannot be prevented by a reflex test.',
 'Checkpoint before blockade; cinematic shot cannot cause a free-roam death. Restore full controls only after rescue; archive wound evidence automatically.',[
 scene('No crossing','Smoke, distant civilian vehicles, failing lights. Track the pickup from rear-left for 5 seconds as the first bridge comes into view. A 3-second insert shows the broken span and Riped\'s erroneous route slip. Gameplay resumes at a safe braking distance.',
 '''CAL|radio|The crossing is gone. Riped, this is not the service road she gave me.
 RIPED|radio, dismissive|It was clear earlier. Stop making it sound deliberate.
 GREVYN|broken radio|Cal? They knew the station. How did they know?
 CAL|urgent|Leave the gate. I am trying the west approach.
 TAYJ|radio|That route has a checkpoint. Wait for a gap, do not go straight through.
 CAL|frightened|She does not have a gap to wait for.
 TAY|radio, firm|And she does not need you dead on the road. Tell us where you are.
 CAL|breath catching|Western turn. I am going back.'''),
 scene('The wound','Follow Cal on foot from cover to barrier for 4 seconds; Voss\'s order breaks the quiet. Cut to his face at the shot, not a graphic impact. Tay drags him into cover. TayJ reverses the rescue vehicle in. Show a treatment card and damaged uniform later in a sober still insert.',
 '''VOSS|amplified|Return to your vehicle. The witness is in protective custody.
 CAL|calling|Grevyn! I came back! I am right here!
 VOSS|clipped order|Stop him.
 CAL|hit, shocked exhale|Fuck. I cannot get my leg under me.
 TAY|close, working|Look at me. Hand here. Keep pressure. I have you, Cal.
 TAYJ|from vehicle|Passenger side is clear. Tay, move on three.
 RIPED|radio, obstructing|Her convoy already left. Stop calling her, you are exposing the channel.
 TAYJ|sharp|Then stop transmitting over him. I am saving this log.
 TAY|to Cal|We are getting help. You do not have to keep standing to prove you tried.'''),
 scene('Stop calling','Workshop refuge. The wounded Cal stays seated; camera slowly follows Tay leaving him privacy but remains in a shared space, not isolating him visually. Cross-cut to Grevyn\'s guarded face in custody. This is their actual last call, not a false memory.',
 '''GREVYN|betrayed|They knew where I was going. I told you that route, Cal.
 CAL|raw|I did not give them anything. I went back for you.
 GREVYN|hard|You were not there.
 CAL|trying to explain|I could not get through. If you would let me finish—
 GREVYN|interrupting|You got yourself out. That is what happened.
 CAL|hurt anger|You think I just fucking left you?
 GREVYN|breaking under control|I think you made your choice.
 CAL|desperate|Then why am I still trying to explain it to you?
 GREVYN|cutting contact|Stop calling me.
 CAL|small, defensive|Fine.
 TAY|later, sitting nearby|You can be angry with her and still want her safe.
 TAYJ|looking at records|Your call never reached her after that. I kept trying.
 RIPED|arriving with an unverifiable report|There is no point now. Her transport did not make it.
 CAL|numb|Did you see her?
 RIPED|deflecting|I saw enough. You need to let this go.''')])

mission('M01','Another Delivery','Chapter 1 - A Voice on the Road',60,'home','HOME','HOME',
 'Introduce the 2096 crew through a supply run, maintenance and ordinary shared decisions.',
 [('Ready the pickup','Check fuel, tires, water and a medical crate with Dain.'),('Deliver to the depot','Drive the local loop and unload supplies with Tay.'),('Return for the night','Check in with TayJ and choose a sleeping place.')],
 ('medical_crate','The delivery crate has a cloth handle beside the tailgate.'),
 'Let Tay ride or coordinate by radio; both count as maintaining contact, neither is a hidden mental-health score.',
 'Mandatory delivery goods respawn at the last safe depot if lost; repairing the truck is a playable task, not a restart.',[
 scene('Five years later','2096. At a warm workshop dawn, track Cal opening the pickup and checking the tire. Keep Tay visible packing her own clinic bag. A 3-second rack focus moves from a patched uniform folded away to civilian work gloves.',
 '''DAIN|listening to engine|That belt is asking for retirement.
 CAL|dry|It and me both.
 TAY|practical warmth|The belt got breakfast. Did you?
 CAL|evasive|There was coffee.
 TAY|unmoved|That is a beverage with ambition. There is bread on the bench.
 TAYJ|radio check|Dispatch to people pretending breakfast is optional.
 CAL|a real smile|Receiving you, TayJ.
 RIPED|entering|Relax. I checked the route. A professional is supervising.
 DAIN|without looking up|Then the professional can carry the crate.'''),
 scene('People still need things','Gameplay unloading at the medical depot. Follow Cal\'s hands placing the crate, then widen to the waiting settlement. No quest completion confetti over the conversation.',
 '''NESS|checking stock|Water filters first. Medicine goes inside, out of the sun.
 TAY|businesslike|And those bandages are for the clinic, not somebody\'s toll booth.
 NESS|tired smile|Tell the toll booth. I have tried.
 CAL|quiet|How many people came in this week?
 NESS|honest|More than we have beds. Less than we feared.
 RIPED|cocky|See? Situation under control.
 TAYJ|radio|That is not what she said.
 CAL|to Ness|We can take a second run before dark.'''),
 scene('A place at the table','Optional evening crew scene becomes mandatory only for the first introduction. Follow Cal sitting beside the others. Leave a vacant chair in the composition without ominous highlighting. Save before the first distant radio interference.',
 '''TAY|setting a boundary|I am on clinic duty tomorrow. Call if you need me; I may not answer immediately.
 CAL|trying not to show dread|Right. I know. You have your own work.
 TAYJ|gentle|I will be on the relay by noon. We can schedule a check-in.
 CAL|admitting it|The quiet gets bad sometimes. When both of you are away.
 TAY|direct kindness|Then tell us. And talk to Dain, sleep, eat. We cannot be your only way through a day.
 CAL|accepting|I know. I am trying.
 RIPED|making light of discomfort|Well, you always have my sparkling company.
 CAL|dry, not cruel|That is one way to describe it.''')])

mission('M02','Cal','Chapter 1 - A Voice on the Road',60,'relay','ROAD_DUSK','SIGNAL',
 'Receive a genuine fragment of Grevyn\'s voice relayed by the road force; safely investigate the transmission.',
 [('Reach the relay','Repair the receiver feed and tune three marked bands.'),('Pull over','Stop the truck safely after hearing the message; choose grounding or a crew call.'),('Record the source','Save the full transmission and its impossible bearing.')],
 ('receiver_feed','The receiver lamp is dark; trace the cable back to the fuse box.'),
 'Player chooses how to handle anxiety; no driving skill penalty or forced crash. Asking for help is never punished.',
 'Replay the message from the recorder; missed words do not lock progress. No deadline while grounding.',[
 scene('The name','Drive approach remains player-controlled. Once safely parked and tuned, cut to the receiver for 3 seconds, then hold on Cal hearing his name. Tiny radio hiss; no jump-scare volume spike.',
 '''GREVYN|genuine recorded fragment, strained|Cal. Save me the window seat.
 CAL|breath gone|No. No, that is not—
 TAYJ|radio|Cal? Your channel is open. Talk to me.
 CAL|anxious, short phrases|I heard her. I know I heard her.
 TAYJ|steady|Set the brake. Tell me one thing you can see.
 CAL|grounding|The receiver light. Amber. My hands are on the wheel.
 GREVYN|fragment, weaker|I cannot keep it quiet much longer.
 CAL|hurt underneath hope|She told me never to call again.'''),
 scene('Not an answer yet','Camera follows Cal stepping outside only if chosen. A static alternative frames the parked cab for reduced motion. Road Force speaks from the roadside radio field; Grevyn\'s voice is not its imitation.',
 '''ROAD|distant, clear|Those are her words. I carried them where a wire could not.
 CAL|angry fear|Who the hell are you?
 ROAD|careful|Something the road was built across. Someone who needs you to listen.
 CAL|skeptical|That is a very practiced way of not answering.
 ROAD|accepting|Then do not trust me yet. Keep the recording. Ask your people to test it.
 TAYJ|radio, firm|I am recording you, too.
 ROAD|plain|Good.
 CAL|controlling his breath|If she is alive, why now?'''),
 scene('A bearing through rock','Three-second insert on receiver needle pointing toward a blocked ridge, then back to gameplay. Cal and TayJ mark uncertainty, not a magical destination pin. Riped arrives after the full recording is saved.',
 '''RIPED|too fast|Old loop. It is a recording from before the collapse.
 CAL|guarded|She said she cannot keep it quiet. That part was never in our calls.
 RIPED|shrugging|You were hurt. You forget things.
 TAYJ|cool|Memory is why we kept the audio.
 TAY|radio|You do not have to forgive her to find out if she is alive.
 CAL|conflicted|I do not even know what I would say.
 TAY|gentle|Start with what you know. Not what you owe her.
 CAL|deciding|We check the source. That is all I am promising.''')])

mission('M03','Check the Source','Chapter 1 - A Voice on the Road',60,'relay','ARCHIVE','SIGNAL',
 'Corroborate the voice through independent timing, a witness and a present-day facility signal.',
 [('Compare recordings','Match the school phrase to the old call without treating voice similarity as proof of life.'),('Contact the relay witness','Drive to Orin\'s archive shelter and inspect recent monitored traffic.'),('Choose the search','Agree a route and crew contact plan.')],
 ('traffic_log','The new entry is under the receiver\'s current date stamp.'),
 'Cal may say he wants answers or wants to help; both begin the journey without forcing forgiveness.',
 'All proof is journaled in separate facts: genuine voice, current carrier, survival unconfirmed until corroborated.',[
 scene('The date on the carrier','At the relay desk, dolly behind TayJ sorting paper logs for 4 seconds. Object-focus shot points to a current-date carrier stamp, not an automatic answer. Player aligns recordings with an accessible button alternative to waveform dragging.',
 '''TAYJ|explaining|The words could be old. The carrier cannot. This relay restarted last winter.
 CAL|measured|So someone sent it recently. Not necessarily her.
 TAYJ|approving|Exactly. We keep those as different claims.
 RIPED|breezy|You are all getting very excited over static.
 TAY|to him|And you are very certain for someone who has not listened.
 RIPED|forced laugh|I heard enough five years ago.
 CAL|to TayJ|Play the complete log. No cuts.
 TAYJ|firm|That is how I kept it.'''),
 scene('A teacher still asking','Orin\'s single-storey archive shelter. Follow him slowly between filing shelves; his body remains in sight when he hands over a recent Trooper frequency list. Warm desk light separates him from cold exterior haze.',
 '''ORIN|recognizing them|The window-seat pair. I hoped you both got farther away than this.
 CAL|careful|Have you heard the name Grevyn on these channels?
 ORIN|weighing a record|A transfer reference. Three weeks ago. I did not know whether to believe it.
 CAL|hope frightening him|May I see the original?
 ORIN|handing it over|That is the right question.
 RIPED|interrupting|A name is not a person. We should not waste supplies.
 ORIN|level|Then let the record disappoint us honestly. Do not edit it in advance.
 CAL|quiet|Thank you.'''),
 scene('A search with limits','Crew route planning around the hood. A low, slow follow travels from Cal to TayJ\'s paper route. Camera returns before the player chooses his stated reason. No romantic framing in close-ups of Grevyn\'s photograph.',
 '''CAL|ANSWER branch; guarded|I need to know who lied. I am not promising a reunion.
 CAL|HELP branch; guarded|If she needs help, I want to try. That does not erase what she said.
 TAY|shared|Both can be true. You can care and still be hurt.
 TAYJ|shared|Scheduled contact at every relay. If a channel fails, we use the next marked stop.
 RIPED|putting himself forward|I will ride with you. Somebody needs to keep this practical.
 CAL|reluctant|You follow the contact plan like everyone else.
 ROAD|through the radio, brief|Follow what can be checked. I will meet you where the signal ends.
 CAL|to the road|And you can start answering questions there.''')])

mission('M04','Safe Passage','Chapter 2 - The Cost of a Road',60,'crossing','ROAD_DAY','CONVOY',
 'Repair a community crossing and escort a mixed convoy; earn trust through useful work.',
 [('Survey the crossing','Walk the bank with Dain; mark the stable service ford.'),('Repair access','Move debris with a winch and fit two support plates.'),('Escort the convoy','Lead three vehicles through, then return a stranded driver\'s supplies.')],
 ('support_plate','The usable plate is beneath the blue tarp by the maintenance truck.'),
 'Donate a repair kit for faster access or collect salvage for a longer repair. Both remain viable and aid the settlement.',
 'Convoy vehicles stop before hazards; recover overturned essential cargo at the nearby yard. No fragile-NPC instant fail.',[
 scene('A road belongs to somebody','Follow Dain and Cal along the bank with the convoy stationary behind them. Hold a wide shot showing the ford and flooded bridge together. A work-light glint suggests a support plate when the survey objective is active.',
 '''DAIN|assessing|Bridge is finished. Ford is not, if we brace the bank.
 NESS|protective|That convoy has families. I will not spend them on a shortcut.
 CAL|straight|Neither will I. We walk it first.
 RIPED|showing off|I could get across in second gear.
 DAIN|dry|Excellent. We will tell the water how impressed we were.
 TAYJ|radio|I have a service yard two kilometers back. Plates, maybe a winch.
 TAY|radio|Tell the convoy we are waiting for a safe crossing, not for permission.
 CAL|to Ness|We can help build one.'''),
 scene('Work before promises','Gameplay labor. At the final brace placement, use a 5-second lateral tracking shot following Cal\'s handoff to Dain, showing safe rigging rather than a quick-time event. Do not play dialogue over loud winch effects.',
 '''NESS|noticing the uniform scar|You were service once?
 CAL|honest|Gucki Troopers. I moved people without asking where they went.
 NESS|cooler|Some of my people were moved.
 CAL|accepting|I know saying sorry does not repair that.
 NESS|clear terms|Then do the work. And do not ask them to make you feel better.
 CAL|quiet|I will not.
 DAIN|calling safely|Line is taking weight. Everybody behind the marker.
 TAYJ|radio|Convoy, hold position until the second brace is checked.'''),
 scene('The last vehicle','Camera follows the last convoy vehicle onto firm ground, then returns to Cal at the stalled driver. Success includes the driver\'s returned crate. No victory sting until the community vehicles have stopped safely.',
 '''NESS|relieved, not absolving|You kept your word about this crossing.
 CAL|modest|About this crossing. Yes.
 TAY|radio|Clinic received the first truck. Driver says you looked exhausted.
 CAL|a little amused|Informants everywhere.
 TAY|warm|Friends. Different department.
 RIPED|claiming credit|My route saved at least an hour.
 TAYJ|flat|Dain\'s braces did. Your route was underwater.
 DAIN|to Cal|Come by the yard. You earned a working jack, at least.''')])

mission('M05','The Price of Help','Chapter 2 - The Cost of a Road',60,'junction','HOME','TOLL',
 'Negotiate passage without treating settlement residents as expendable; learn how faction support changes routes.',
 [('Hear the demands','Meet Ness and the junction toll crew in daylight.'),('Choose a workable exchange','Deliver filters, repair the pump or pay from noncritical funds.'),('Reopen the shared road','Test the pump or verify payment and witness civilian passage.')],
 ('pump_valve','The pressure gauge beside the pump is stuck at zero.'),
 'Three valid solutions. Display costs before selection. Never silently consume medical supplies reserved for Grevyn.',
 'If funds are insufficient, the repair route stays available; a hostile response diverts to a longer safe road, not a softlock.',[
 scene('A hefty price','At junction barriers, follow Cal stepping away from the truck with empty hands. Keep enforcers and exit visible in the wide shot. A small red lamp on the dry pump establishes the practical problem.',
 '''NESS|tired negotiation|The toll pays the pump crew. The pump feeds three stops.
 CAL|skeptical|And people without money?
 NESS|not proud|Wait. Sometimes too long.
 RIPED|joking at the wrong time|Finally, a queue worse than government service.
 TAY|cold to him|Read the room.
 DAIN|practical|The pump might need a gasket, not a treasury.
 CAL|to Ness|Show us. Then we talk price.
 NESS|accepting scrutiny|Bring your own gauge. I would.'''),
 scene('What can be spared','Gameplay inspection, then player-facing itemized exchange screen. Camera may focus on the damaged gasket for 3 seconds after examination, never before entering the pump shelter. Choices use explicit quantity and travel-time previews.',
 '''DAIN|examining|Housing is sound. Seal is split. We can cut a replacement at the yard.
 TAY|protecting medicine|Not from a sterile pack. Those stay sealed.
 CAL|acknowledging|We use workshop rubber, or we pay. No borrowing from the clinic.
 TAYJ|radio|I marked the longer route, too. More fuel, fewer promises.
 RIPED|dismissive|Everybody wants a committee meeting for a gasket.
 NESS|sharp|Everybody wants water. That is why we are talking.
 CAL|choosing|Tell me exactly what the repair buys for the people behind us.
 NESS|committing|Passage until next maintenance, posted in writing.'''),
 scene('A posted agreement','Follow Ness pinning the agreement to the barrier and opening it for a civilian vehicle before Cal\'s truck. If alternate route chosen, use radio confirmation instead; do not falsely show an unpaid toll opening.',
 '''CAL|REPAIR or PAY|Open it for them first.
 NESS|REPAIR or PAY|That is the agreement.
 DAIN|REPAIR|Gauge is holding. I left the spare seal with the crew.
 TAYJ|DETOUR|Fuel stop marked. The shared road is still closed, so we tell the next convoy.
 TAY|shared|A delay is survivable. Losing the medicine might not be.
 CAL|shared|Then we make the delay useful.
 ROAD|brief, fading|Some roads become safe because people make them so.
 CAL|low|Try telling me something useful about Grevyn next.''')])

mission('M06','The Wrong Story','Chapter 2 - The Cost of a Road',60,'market','ROAD_DUSK','DOUBT',
 'Collect conflicting accounts of Grevyn and separate firsthand sighting from propaganda.',
 [('Interview witnesses','Hear Ness\'s supply contact, Dain\'s road account and a regime broadcast.'),('Compare dates','Pin each source to an independently verified convoy date.'),('Follow the consistent lead','Mark the government archive without declaring all rumors true.')],
 ('convoy_receipt','There is a date on the back, below the freight stamp.'),
 'Cal can challenge Riped now or hold questions. TayJ keeps discrepancies either way; no early forced villain reveal.',
 'Witness audio and receipts remain replayable. Hostile market encounter relocates interviews to the public radio booth.',[
 scene('A woman at the checkpoint','Track Cal and Ness through the market at walking speed, no fast orbit. End on a freight receipt, after the witness account. Reused supporting performers must keep new roles distinct; here Ness recounts her own direct contact.',
 '''NESS|remembering|A woman stopped their search. Said the driver was not the one they wanted.
 CAL|careful|Did she give a name?
 NESS|honest uncertainty|Grevyn. But I did not know her before that day.
 RIPED|quick|Then it proves nothing.
 CAL|restrained|It proves she heard a name. Let her finish.
 NESS|uneasy|The lights went out when the officer touched her. Every light, even the truck.
 TAY|watching Cal|We write down exactly that. Not a miracle, not a diagnosis.
 TAYJ|radio|And a date. Give me the receipt.'''),
 scene('The face in the broadcast','A public monitor shows Grevyn still, conditioned and calm beside regime insignia. Cut from Cal to the screen once, then hold for the full statement. Do not show supernatural possession as proof of voluntary loyalty.',
 '''GREVYN|conditioned recording|Order is not what destroyed us. Abandoning it did. The Scatterballasian Regime will protect the roads again.
 GUCKI|recording, paternal|Those who return have a place. Those who endanger our peace will answer for it.
 CAL|stung|That does not sound like her.
 RIPED|casual certainty|People change. Maybe you never knew her that well.
 TAYJ|controlled irritation|You said she was dead. Now you know what she believes?
 RIPED|covering|I am saying if it is her.
 CAL|hurt, suspicious|You did not say if.
 TAY|to Cal|We still need to know what happened to her.'''),
 scene('Three dates','At a quiet roadside table, move over the evidence board only after the player places receipts. The current-day broadcast and pre-collapse informant account cannot be merged into one date. TayJ preserves Riped\'s contradiction as a question.',
 '''TAYJ|precise|The supply convoy was last month. The public clip is newer. The prison report is five years old.
 CAL|working through it|Different people can be describing the same person at different times.
 TAY|soft|And she can be alive without being safe.
 RIPED|scoffing|Or the whole thing is bait.
 CAL|plain|It might be. That is why we check it.
 ROAD|on receiver|There is a report in the southern archive. It carries your name.
 CAL|angry suspicion|What did you leave out this time?
 ROAD|quiet|Enough that you should read it yourself.''')])

mission('M07','His Name on the Page','Chapter 3 - Who Signed It',80,'archive','ARCHIVE','PAPER',
 'Discover the denunciation attributed to Cal and recover the unedited protective request.',
 [('Enter the archive','Use local access earned at the crossing or restore its public generator.'),('Find both versions','Compare the protective request carbon with the detention order.'),('Secure provenance','Record terminal timestamps, token use and document custody.')],
 ('request_carbon','The transfer ledger has a thin carbon page folded into its rear cover.'),
 'Tell Tay the shame immediately or ask for a private moment; evidence reaches both friends before the next chapter.',
 'Never destroy originals as a progression action. Scanned copies survive cargo loss with retrieval of originals optional for presentation.',[
 scene('A signature is not a history','Slow follow behind Cal through archive aisle. A close shot reveals his service identity on the detention order only when he opens the folder. Hold his reaction without a dramatic camera shake.',
 '''CAL|recognition|That is my service number.
 TAY|careful|Read the rest before you decide what it means.
 CAL|sickened|Witness Grevyn. Immediate detention. They used my name.
 RIPED|feigned sympathy|You signed a lot of things then. We all did.
 CAL|angry|I remember what I asked for.
 TAYJ|radio|Then find the original request. Names can be copied. Context takes work.
 ORIN|beside the cabinet|Government records have margins. That is where people sometimes kept the truth.
 CAL|steadier|Show me the carbon ledger.'''),
 scene('Protective transport','Object hint highlights the raised carbon edge only after Cal examines the ledger. A 4-second split composition frames protective pickup on one page and detention on the other. Player confirms three differences with a readable text option.',
 '''CAL|reading original|Protective pickup. No named witness. West service approach.
 TAYJ|radio|Now the copy they filed.
 CAL|controlled anger|Threat assessment. Named witness. Authorized detention. They changed the request.
 ORIN|explaining|Your signature was retained from the first form. The second carries a later transmission time.
 RIPED|trying to trivialize|Bad clerks. Half the state ran on bad clerks.
 TAY|sharper than before|That is not a spelling mistake.
 CAL|looking at Riped|No. It is somebody choosing words.
 ORIN|firm|Keep both pages. An accusation needs more than the page that hurts most.'''),
 scene('Who had access','Evidence desk. Follow Tay photographing the terminal custody sheet, then a short insert of the shared-session token number. No name is revealed as culprit yet: access is a lead, not conviction.',
 '''TAYJ|precise|The second message used your token after you left the depot.
 CAL|remembering|I did not check it at the truck. She called. I just went.
 RIPED|quickly|Anybody could have used that desk.
 CAL|level|Yes. So we find out who did.
 TAY|to Cal|You still signed earlier transfers. This does not make those disappear.
 CAL|accepting|I know. But I did not hand her over.
 TAYJ|radio|We can hold both truths without dropping either one.
 CAL|quiet determination|Then that is what we do.''')])

mission('M08','What the Recording Says','Chapter 3 - Who Signed It',80,'relay','SERVICE','CUT_TAPE',
 'Recover full radio traffic and expose the edits used to manufacture Cal\'s agreement to the arrest.',
 [('Restore the relay recorder','Fit a replacement drive and recover the intact transport channel.'),('Compare three cuts','Match phrase boundaries, ambient noise and transmission time.'),('Preserve the raw stream','Make an offline duplicate and deliver one to the archive.')],
 ('raw_drive','The sealed drive is in the recorder base, below the empty cassette slot.'),
 'Confront the lie or ask Riped to explain technical access. He evades; no route allows him to delete earned proof.',
 'Accessible transcript comparison replaces audio puzzle. Lost drive can be recovered from archive mirror after first verification.',[
 scene('A convenient sentence','Relay workbench, player-controlled repair. Once the drive spins, cut to a static medium shot of the crew listening. Edited speech is tagged as evidence playback in subtitles so actors do not perform it as a new confession.',
 '''TAYJ|introducing playback|This is the filed excerpt. Notice the hiss change after hold.
 CAL|hearing himself|They made me sound like I was giving an order.
 TAY|angry|Play what came before it.
 RIPED|too casual|A damaged recorder skips. That is what damaged things do.
 TAYJ|pointed|A skip does not move a reply from one hour into another.
 CAL|to Riped|Let her finish.
 TAYJ|steady|Here is the full channel. We keep the noise between the words.
 CAL|bracing|Go on.'''),
 scene('A rescue note','Insert the real handwritten note Cal retrieves from a civilian transport packet. The same words were attached to Grevyn\'s detention file. Follow Cal carrying both documents to the table; no floating text substitutes for a physical prop.',
 '''CAL|reading context|Hold her at the station until the vehicle arrives. This was a civilian with a broken hip.
 TAY|remembering|I treated her. You were asking them not to leave her on the platform.
 TAYJ|connecting|They removed the patient sheet and kept your handwriting.
 CAL|shaken|They knew exactly how she would read it.
 RIPED|provoking doubt|Or you are remembering the version you can live with.
 TAY|cold|I was there.
 TAYJ|firmer|And the patient register was there. We are not voting on a memory.
 CAL|to his friends|Thank you for keeping it.'''),
 scene('Not enough to name him','Camera follows TayJ sealing an offline duplicate. A 3-second focus on the transfer hash and date reinforces provenance. Leave Cal and Riped in the same frame with physical distance growing between them.',
 '''CAL|to Riped|You keep having an answer before we have a question.
 RIPED|offended performance|I am trying to keep you from doing something stupid.
 CAL|level|Then help. Tell us who used the desk after I left.
 RIPED|evasive|It was evacuation. People were everywhere.
 TAYJ|recording|I will put that down as you do not know.
 RIPED|snapping, then laughing|Put down whatever you want. Apparently that is your job.
 TAY|to Cal afterward|I still want him to be our friend. That is not evidence either.
 CAL|sad|No. It is not.''')])

mission('M09','Where They Found Him','Chapter 3 - Who Signed It',80,'workshop','HOME','SECOND_ROAD_SOFT',
 'Return to the 2091 rescue site and assemble independently dated evidence of Cal\'s attempted return.',
 [('Reach the old workshop','Retrieve Tay\'s treatment card and TayJ\'s rescue route record.'),('Survey the approaches','Inspect the destroyed crossing and marked blockade remains.'),('Build the chronology','Align injury, travel and intercepted-call times.')],
 ('treatment_box','Tay put the old treatment cards above the dry storage shelf.'),
 'Cal chooses whether to show the scar now; final reveal uses consent again. Scar alone never proves betrayal or attacker identity.',
 'No replayed injury damage. Trauma scenes allow static camera, subtitles and a pause without changing outcome.',[
 scene('The room they borrowed','Track Cal entering the preserved workshop. Match the P04 rescue composition without a jump cut to the gunshot. Tay opens the treatment box only when asked. TayJ keeps the vehicle route chart within reach.',
 '''CAL|quiet|I remembered the ceiling lower.
 TAY|gentle|You spent most of the week looking at it from that cot.
 TAYJ|placing a folder|Rescue route, fuel receipt, transmission log. Original times, not reconstructed ones.
 CAL|strained humor|You really do keep everything.
 TAYJ|soft|I kept you. The paperwork came with it.
 TAY|matter-of-fact|Treatment started twenty-one minutes after the blockade shots.
 CAL|checking the record|After the time the report says I accepted evacuation payment.
 TAY|firm|You were bleeding on this floor then.'''),
 scene('Both roads','Wide follows at each route separately. Player inspects span damage and a service-road barrier mount. Ghostly memory overlays are optional, labelled subjective; objective journal evidence comes from documents and dated rescue travel, not visions.',
 '''CAL|at first route|Riped said this was quicker. It led nowhere.
 TAYJ|precise|We cannot prove he knew the crossing was down. We can prove you turned around.
 TAY|at second route|This is where we found you.
 CAL|breath thinning|I could hear the convoy. I thought if she heard me—
 TAY|grounding|You are here now. Feet on the road. Take the time you need.
 CAL|after a breath|I want to finish the record.
 TAYJ|gentle|Then we finish it together.
 ROAD|faint|What you tried was real, even when she could not see it.'''),
 scene('A body is not the whole proof','Sheltered table, static camera. Cal may uncover the healed scar briefly without sensational close-up, then cover it. Show the complete chronology next to it. The falsified payment entry is contradicted by a duplicated account number and recovery records.',
 '''CAL|choosing to share|This is where it hit. I can show her. If she will let me speak.
 TAY|honest|It proves you were shot. These records show when and where. We need both.
 TAYJ|adding page|And the payment never entered your account. They copied a cleared voucher number.
 CAL|angry grief|She believed I sold her for a seat out.
 TAY|hurt for both|Someone worked hard to make that believable.
 RIPED|from doorway, uneasy joke|We nearly done with the museum tour?
 CAL|no laugh|Not yet.
 TAYJ|closing the case|Now we ask who kept her alive afterward.''')])

mission('M10','Refuge','Chapter 4 - The Cure She Hid',60,'refuge','REFUGE','REFUGE',
 'Find the former resistance shelter and learn how protection became coercion.',
 [('Earn entry','Repair the shelter water line and meet Merrin under civilian oversight.'),('Find admission records','Locate Grevyn\'s voluntary refuge request and later confinement order.'),('Open the laboratory wing','Restore a manual door mechanism and preserve its contents.')],
 ('intake_folder','The intake card is filed under arrivals, not detainees.'),
 'Offer Merrin public testimony protection or insist on supervised custody; neither absolves her or destroys her research.',
 'Evidence is mandatory and cannot be traded for passage. Locked-wing bypass remains available if Merrin refuses cooperation.',[
 scene('They promised protection','Track Merrin leading Cal through the shelter\'s communal room, 6 seconds; pass an old resistance banner repurposed as a curtain. End at a locked clinic door. Civilians continue ordinary activity rather than staring as a hostile crowd.',
 '''MERRIN|guarded|She came here because we said nobody would be handed back.
 CAL|hard|Did you keep that promise?
 MERRIN|not evading|Not the promise she thought we made.
 TAY|controlled anger|Then explain what you did keep.
 MERRIN|ashamed|The doors closed. Supplies stopped. Our leaders started calling people assets.
 RIPED|too breezy|Desperate times. We have all heard the story.
 TAYJ|sharp|We have not heard this one. Stop finishing it for her.
 CAL|to Merrin|Start with the day Grevyn arrived.'''),
 scene('A change of category','Player reads Grevyn\'s refuge application beside a later restricted-subject order. Camera hints at mismatched staples after the first examination. The documents explicitly separate resistance origin, corruption and subsequent regime partnership.',
 '''MERRIN|remembering|We had fought the regime. That part was real.
 CAL|reading|Then you took its equipment. Its methods.
 MERRIN|quiet|And told ourselves the purpose made them different.
 TAY|cold|Did she consent to the exposure?
 MERRIN|plain|No.
 CAL|anger contained|Say the whole thing.
 MERRIN|facing it|We promised protection, confined her and exposed her without consent.
 TAYJ|recording|That statement goes with the signed order.'''),
 scene('A voice in the margin','Laboratory entrance. Follow Cal opening the manual shutter; focus for 3 seconds on tiny handwriting behind a maintenance label. Do not reveal the formula yet. Road Force avoids answering a question; Cal notices.',
 '''CAL|reading a fragment|If I forget what this is for, read the blue pages first.
 TAY|recognition|She was leaving instructions for herself.
 ROAD|radio, pained|And for whoever reached her afterward.
 CAL|suspicious|You know this room.
 ROAD|evasive|I know what happened here.
 CAL|not accepting|Those are different things.
 MERRIN|looking at the receiver|You brought the road with you.
 TAYJ|quiet alarm|We are going to need more batteries. And better answers.''')])

mission('M11','Treatment','Chapter 4 - The Cure She Hid',60,'refuge','LAB','PASTE',
 'Discover Gucki Paste\'s three linked functions and why sudden deprivation would endanger Grevyn.',
 [('Audit the dosing station','Read administration logs without dispensing anything to a person.'),('Recover observation films','Compare lucidity, instability and physical decline across dated sessions.'),('Plan a substitute','Mark the medical support system and locate a stabilizer research reference.')],
 ('dose_log','Three columns repeat on every page: body, field and compliance.'),
 'Acknowledge that withholding Paste is not a rescue plan. No option administers or withholds real treatment by guesswork.',
 'All research is fictional. Puzzle uses inventory seals and document ordering, not a real chemical recipe.',[
 scene('Three things at once','Follow Tay through the dosing bay. Close focus on three labelled channels in a fictional apparatus: somatic support, field regulation, compliance. Avoid syringes in close-up; environmental restraint marks convey abuse without spectacle.',
 '''TAY|reading carefully|It is keeping her body going. That does not make it medicine she chose.
 CAL|working it out|And it feeds whatever is controlling her.
 MERRIN|admitting|It regulates the field, sustains damaged tissue and reinforces the connection.
 RIPED|simplistic|So take it away. Problem solved.
 TAY|firm|Her organs fail. The field becomes unstable. She may get lucid and die knowing it.
 CAL|angry at the situation|They built a fucking leash out of keeping her alive.
 TAYJ|radio|Then we find a way to support her without the leash.
 TAY|quiet resolve|That is the problem we solve.'''),
 scene('The lucid interval','Projection of Grevyn\'s own lab recording, visibly dated. Frame the screen in a neutral room, not as an apparition. Her speech is exhausted but exact. Cut to the player-controlled notebook after the entire recording.',
 '''GREVYN|lucid archive recording|Reduced dose. I know my own name again. I also cannot keep my hands warm.
 GREVYN|recording, measuring herself|The power has not vanished. It is coming loose. That is not the same thing as freedom.
 GREVYN|recording, determination|There must be support without reinforcement. I have started a separate formula.
 MERRIN|after playback|We confiscated it. She started again.
 CAL|stunned admiration|Of course she did.
 TAY|grim|Where is the second set?
 MERRIN|honest uncertainty|I never found it. I thought she had given up.
 CAL|quiet|You did not know her very well.'''),
 scene('Do not make it a countdown','At the workbench, Tay marks unknowns on a fictional treatment chart. The guide for players explicitly says exploration is not running down an unseen biological timer. Road Force confirms residual energy can still threaten them.',
 '''CAL|anxious|Are we wasting time every minute we stand here?
 TAY|clear|We do not know her current dose. Panic will not replace a plan.
 TAYJ|radio|We follow the next lead. We do not pretend the road is a stopwatch.
 ROAD|careful warning|Weakening the connection will not empty what has already gathered around her.
 CAL|challenging|Then tell us how to separate it safely.
 ROAD|plain|Not here. Not without something that keeps her alive.
 TAY|deciding|We find her formula first.
 CAL|with purpose|Then we finish what she started.''')])

mission('M12','Something She Hid','Chapter 4 - The Cure She Hid',60,'refuge','ARCHIVE','BLUE_PAGES',
 'Recover Grevyn\'s first hidden Golghis research and her testimony during lucid captivity.',
 [('Read the maintenance trail','Match three harmless-seeming repair requests to room positions.'),('Open the false shelf','Use Grevyn\'s map-cabinet habit to find her notebook compartment.'),('Recover her voice','Play her warning and preserve the notebook separately from its copy.')],
 ('false_shelf','The shelf depth changes beneath the blue maintenance mark.'),
 'Cal can hear a personal note now or later. The clinical findings are mandatory and her intimate recording is never public currency.',
 'No memory trivia lock: the prologue journal recalls the cabinet method. All clue objects remain available after discovery.',[
 scene('Repairs she did not need','Track Cal counting shelf bays while TayJ reads maintenance requests over radio. At the false shelf, use a 3-second oblique view revealing a depth mismatch. The hint activates only after two legitimate searches.',
 '''TAYJ|reading|Three requests for a broken hinge. The hinge was replaced every time.
 CAL|thinking|She wanted people looking at the front.
 TAY|noticing|Like the map cabinet.
 CAL|a little warmth|She hated a hiding place that looked clever.
 RIPED|scoffing|Or it is just a badly built shelf.
 CAL|checking|Then we check it, and it is a badly built shelf.
 TAYJ|pleased|A very scientific method.
 CAL|finding the seam|There. Blue paper.'''),
 scene('For whoever finds this','Notebook found. Static medium shot while Grevyn\'s recorded voice plays; do not animate a hallucinated Grevyn speaking to Cal. Her research owns the scene. Object close-up shows the name Golghis, not an invented real medical formula.',
 '''GREVYN|lucid recording|Golghis. A stupid name on purpose. Something that was mine before they numbered it.
 GREVYN|recording, careful|The substitute supports the damage without feeding the bond. It does not heal everything.
 GREVYN|recording, urgent|Do not use the first draft. Two pages are wrong because I wrote them while it was speaking through me.
 GREVYN|recording, tired|I marked the corrected sequence with the school map. West, not north.
 CAL|soft, hurt|You left yourself a way back.
 TAY|respectful|We are going to use her corrections, not make her into a miracle.
 RIPED|dismissing|A notebook is not a cure.
 CAL|firm|No. It is a start she made while you thought she was dead.'''),
 scene('A note he can leave closed','Player choice before personal recording. If declined, it stays in private journal for later. Camera stays at respectful distance; no forced tears. The research copy is sealed before departure.',
 '''GREVYN|PERSONAL; recording|I do not know whether I hate you, Cal, or whether hating you is one of the things they kept giving me.
 GREVYN|PERSONAL; recording|I remember you not coming. I remember a version where I heard you outside. I cannot make them fit.
 GREVYN|PERSONAL; recording, faltering|If you are real when I see you, let me finish a sentence before you leave.
 CAL|PERSONAL; shaken|I was trying to finish mine.
 TAY|shared|You do not have to answer her today.
 TAYJ|radio|Clinical pages copied. Private recording stays private.
 CAL|shared, gathering himself|Good. Next lead.
 ROAD|barely audible|She kept more of herself than they understood.''')])

mission('M13','Golghis','Chapter 4 - The Cure She Hid',60,'workshop','HOME','BLUE_PAGES',
 'Establish the viable treatment path and a transparent rescue preparation checklist.',
 [('Reconstruct the index','Separate lucid corrections from compromised notebook pages.'),('Consult the specialist trail','Identify Dr. Sable Nadir\'s annotations and captivity location.'),('Make a rescue ledger','List missing pages, support medium, sealed carrier and catalyst activation.')],
 ('corrected_index','The west-facing map symbol marks Grevyn\'s corrected pages.'),
 'Commit to the full investigation or mark a provisional faster route. Both remain reversible until final consent.',
 'Checklist always shows known, missing and replaceable components. It does not call incomplete Paste safe.',[
 scene('A plan with missing pieces','At a workshop board, follow Cal pinning Grevyn\'s handwritten index beside Tay\'s support chart. Player sorts page symbols; accessible list selection does the same task. Camera never auto-solves the order.',
 '''TAY|pointing to a gap|She solved the principle. We still need the support medium and someone who can check the process.
 CAL|to TayJ|The notes in the margins. Different hand?
 TAYJ|radio|Dr. Sable Nadir. One transfer log says she was moved to holding twelve.
 RIPED|mocking|Great. Another prisoner. We can rescue the whole country while we are at it.
 TAY|sharp|Sable is a person, not a delay.
 CAL|firm|And we do not make Grevyn drink a guess.
 DAIN|practical|Tell me what needs transporting. I will build a cradle that keeps it level.
 TAYJ|radio|I am making a checklist we can all read.'''),
 scene('What preparation buys','UI checklist comes after the spoken explanation. Each item has an explicit effect: complete formula, verified support, activated catalyst, working containment, enough force reserve or replacement capacitors. No percentage promise yet.',
 '''TAY|clear|With verified Golghis, her body gets support while the bond weakens. That gives us a planned severing.
 ROAD|through receiver|Without it, what I tear away may take her with it.
 CAL|serious|And with it?
 ROAD|honest limits|You still need the equipment and her consent when she can give it. I cannot replace either.
 TAYJ|radio|Missing now does not mean missing forever. We marked the recovery stops.
 RIPED|impatient|Or we go straight there before everybody dies of planning.
 CAL|angry|Rushing blind nearly got me killed once.
 TAY|steady|Then we know what to do differently.'''),
 scene('Who gets to decide','Crew discussion at camp. Follow Tay stepping away to her own clinic radio call before returning, showing her life beyond Cal. Cal may disagree without relationship-score punishment. Save the chosen plan as intent, not outcome.',
 '''CAL|FULL route|We follow her work. Every page we can recover.
 CAL|FAST route|We investigate on the way, but I want a shorter route marked too.
 TAYJ|shared|Marked. You can change it at the next relay.
 TAY|shared|And when we reach her, we explain it to her. We do not take over because we came to help.
 CAL|shared|Yes. No more deciding she is an asset.
 RIPED|lightly|Heroic. Very moving. Can we eat now?
 CAL|controlled|After you help Dain unload. You volunteered to be practical.
 DAIN|dry|I wrote it down.''')])

mission('M14','The Missing Work','Chapter 5 - A Way to Keep Her Here',60,'fieldlab','LAB','BLUE_PAGES',
 'Recover Grevyn\'s corrected research from a mobile laboratory route.',
 [('Trace the field lab','Follow dated service receipts to a deserted mobile-lab bay.'),('Recover three corrections','Search the desk, cold store and maintenance locker using the index.'),('Verify the sequence','Send page identifiers to Tay and preserve the redacted experiment victims list.')],
 ('maintenance_locker','The locker label uses the same west-facing map symbol.'),
 'Release victim names privately to families or retain them with an independent archive; never broadcast them over open radio.',
 'Each research page is separately journaled. Missing cargo can be replaced from the verified scan at the relay.',[
 scene('A lab on wheels','Follow Cal alongside the abandoned trailer, avoiding its blocked front door; a wide shot shows a viable side entrance. Small reflection on a service receipt suggests the trail without a giant beam through walls.',
 '''DAIN|surveying|Trailer axle is broken. Somebody stripped the wheels, not the cabinets.
 CAL|looking at numbers|This is the unit on her index.
 RIPED|nervous humor|Excellent. Deserted medical equipment. My favorite holiday.
 TAYJ|radio|Three storage positions. Do not assume the first page is the last draft.
 CAL|dry|I was in history class, remember?
 TAYJ|fond|You slept through the footnotes.
 CAL|a brief smile|Grevyn did not let me.
 TAY|radio|Neither will I. Gloves before that locker.'''),
 scene('The corrected sequence','After collection, player aligns page identifiers with Grevyn\'s audio. Camera pushes only to the crossed-out field, not a readable real chemical process. Warnings distinguish deliberately false notes from her recovered corrections.',
 '''GREVYN|research recording|If the field meter rises when the support starts, stop. You have copied their version.
 GREVYN|recording|The corrected carrier holds the body steady while the bond drops. There are three checks. Keep all three.
 CAL|to Tay|We have the corrections. You can read her own checks beside them.
 TAY|radio, relieved|Good. That is a treatment protocol we can verify, not hope with a label.
 RIPED|pushing|Could have got the same information at the main facility.
 CAL|suspicious|How do you know what is still in the main facility?
 RIPED|quick cover|Because it is the main one. Obviously.
 TAYJ|radio, after a beat|I am keeping that answer too.'''),
 scene('Names are people','Cal finds victim records tucked with the corrections. Hold a quiet static shot, no collectible jingle. The choice concerns protected custody, not whether to keep evidence. Dain begins constructing the cargo cradle nearby.',
 '''CAL|quiet anger|They numbered them. She wrote the names back in.
 TAY|radio|Then we keep them protected. Families should not learn this from a public frequency.
 DAIN|soft|My brother disappeared on a transfer. Could I check privately?
 CAL|gentle|Yes. Take your time.
 RIPED|trying a joke, failing|Looks like we are taking all the time.
 DAIN|flat warning|Not this time, Riped.
 CAL|to TayJ|Victim ledger goes in the private case. Formula copy goes to you.
 TAYJ|radio|Separate channels. Separate copies. Understood.''')])

mission('M15','Someone Who Can Read It','Chapter 5 - A Way to Keep Her Here',60,'junction','ROAD_DAY','MISSING',
 'Find Sable\'s current detention route and secure help without trading away other prisoners.',
 [('Visit the transfer market','Compare three route slips with Ness\'s supply ledger.'),('Trace the convoy','Follow abandoned tire marks to the holding-facility service district.'),('Arrange extraction','Prepare a clinic vehicle and an independent civilian evacuation line.')],
 ('transfer_slip','Look for Sable\'s clinic code beneath the freight number, not her full name.'),
 'Assist displaced civilians for a safer extraction route or repair the service bypass for a quieter one. Both can be completed.',
 'The prison visit occurs later in M18-M21. This mission provides intelligence, not a fake rescue already completed.',[
 scene('A route is not a warrant','Public records stall. Track Ness bringing Cal a supply ledger; keep refugees in the scene as autonomous people. Player must compare dates before a route pin appears.',
 '''NESS|firm terms|I can show you deliveries. I cannot promise who is still inside.
 CAL|respectful|That is enough to start.
 TAYJ|radio|Sable\'s clinic code appears twice. One line is an old route.
 RIPED|confident|North holding. Always north holding.
 CAL|testing him|When were you last there?
 RIPED|brushing it off|You learn these things. I keep my ears open.
 NESS|to Cal|South deliveries increased last week. Read the dates.
 CAL|quietly|We will.'''),
 scene('An extraction for more than one','At the service district overlook, camera follows Dain positioning the clinic van behind cover, then returns before player selects a bypass. No hostile base map reveals unexplored interior rooms.',
 '''DAIN|planning|I can fit a stretcher and four seats if we remove the rear bench.
 TAY|firm|Leave space for people we do not know yet.
 CAL|agreeing|We do not walk past a prisoner because their name was not on our plan.
 RIPED|mocking|That is how you end up with no plan.
 TAYJ|radio|No. That is why we brought a second vehicle.
 NESS|over radio|My people can take civilians at the crossing if you get them out.
 DAIN|to Cal|Tell me which road to clear.
 CAL|decisive|Both, if we can. Quiet first, obvious if it goes wrong.'''),
 scene('A voice on a test channel','Sable\'s short intercepted message confirms survival and a medical transfer list. Speaker is offscreen, physically elsewhere. Camera stays on the receiver and Cal\'s notes, no impossible cut to a place the crew has not seen.',
 '''SABLE|intercepted, urgent|This is Nadir. I am not authorizing any field transfer. These people need monitoring.
 VOSS|intercepted|Your authorization is no longer required.
 SABLE|intercepted, furious|Then stop putting my name on it.
 CAL|recognizing the pattern|They do not get very original, do they?
 TAY|radio|She is alive. We keep the plan careful.
 TAYJ|radio|And we do not answer on that channel. They may be listening for help.
 RIPED|too eager|See? We should go straight in.
 CAL|firm|After supplies. After the way out is ready.''')])

mission('M16','Cargo Worth Taking','Chapter 5 - A Way to Keep Her Here',60,'supply','ROAD_DAY','CONVOY',
 'Collect fictional sealed medical support components and transport them without harming local care.',
 [('Source the components','Obtain a sealed support cartridge, inert carrier gel and insulated transport case.'),('Earn replacements','Restore a community refrigeration unit or make a reciprocal supply run.'),('Protect the shipment','Secure the cradle, cool it at two checkpoints and deliver to the workshop.')],
 ('case_latches','The case is not secured until both orange cradle straps are fastened.'),
 'Raid abandoned stock or earn clinic surplus; taking clinic essentials is explicitly blocked. Cargo damage opens replacement work.',
 'Temperature uses leg-based checks, not a hidden real-time timer while paused or exploring. Guaranteed replacement mission remains before M35.',[
 scene('Not their last box','Clinic store, warm daylight and a working fan. Follow Tay examining seals while Cal reads the stock card. No threatening music for a supply negotiation.',
 '''TAY|to Ness|We need the support cartridge, but not if this is your last one.
 NESS|clear|It is the last ready one. Fix the cold room and I can release the next batch.
 RIPED|impatient|We could just take the box and be gone.
 CAL|sharp|No.
 NESS|watching him|That answer is worth more than your old badge.
 DAIN|practical|Compressor mount first. Then the belt. We can do it.
 TAYJ|radio|I found the service manual. It even has pictures for Riped.
 RIPED|annoyed|Hilarious.'''),
 scene('The cradle','Playable repair and loading. A 4-second tracking insert follows the case into Dain\'s cradle, ending on two unfastened straps as an interaction hint. Camera releases before fastening; no auto-completion.',
 '''DAIN|instructing|Weight low. Lid toward the cab. Both straps, not one.
 CAL|checking|If the cooling light changes?
 TAY|clear|Pull into the marked shade stop. Do not open the sterile compartment.
 TAYJ|radio|Two cooling stops on the route. No surprise timer while you are reading the map.
 CAL|grateful|Good.
 RIPED|showing off|I could carry it on my knees.
 DAIN|dry|And I could bill your knees for the replacement. Use the cradle.
 TAY|after the check|Seals intact. We can move.'''),
 scene('A choice that is visible','At a threatened supply detour, slow the action into an explicit route decision before any cargo loss. Show resource preview and replacement location. The player can protect cargo, rescue stranded civilians with a detour, or do both with extra work.',
 '''TAYJ|radio|Stranded vehicle ahead. We have room, but the short road crosses broken ground.
 CAL|checking|Long way costs fuel, not the case?
 DAIN|radio|Correct. I checked the roadbed.
 TAY|radio|If the case is compromised, we replace it. We do not pretend the risk went away.
 RIPED|pressuring|Or we keep driving and stop adopting people.
 CAL|firm|They can hear you.
 NESS|radio|I have replacement stock coming. Bring the people if you can.
 CAL|to crew|Show me both routes. We choose knowing the cost.''')])

mission('M17','The Warning','Chapter 5 - A Way to Keep Her Here',60,'ridge','ROAD_DUSK','ROAD_FORCE',
 'Learn the cost of the road force\'s help and prepare for a government-building evidence search.',
 [('Reach the ridge relay','Repair a passive repeater instead of requesting an immediate intervention.'),('Test the warning','Observe a small controlled physical intervention and its measurable depletion.'),('Plan the archive entry','Agree check-ins, exit signals and a missing-contact response.')],
 ('passive_repeater','The relay can carry the message if its ground cable is reconnected.'),
 'Ask for physical help or do the repair; the cost is shown first. Restoration options later prevent a hidden early-choice bad ending.',
 'No intervention spends unconfirmed reserve. A minimum narrative display can be free; physical work costs persistent reserve.',[
 scene('Something moves','At a ridge maintenance hut, follow Cal to a fallen gate. Road Force offers to lift it; the player may repair the winch instead. Its spectral field is sparse amber dust following road seams, distinct from Dominion\'s cold electrical geometry.',
 '''ROAD|tired|I can move the gate. It will leave less of me for what comes later.
 CAL|skeptical|How much less?
 ROAD|plain|One measure of what I have left. Your receiver can show it.
 TAYJ|radio|I am putting the change on the meter. Before and after.
 DAIN|radio|Or repair the winch. Forty minutes of work beats an unexplained miracle.
 CAL|to the force|You do not get to spend yourself without telling us the price.
 ROAD|accepting|Agreed.
 RIPED|flippant|Very moving. Even the ghost gets a budget.'''),
 scene('What it will not say','Static shot of the receiver\'s depleted or preserved field display. Road Force acknowledges the need for equipment but withholds its past involvement; stage a short silence and let Cal react. No fake objective suggests its whole story is known.',
 '''CAL|direct|Were you there when they first exposed her?
 ROAD|after a pause|Yes.
 CAL|insistent|Were you trying to stop it?
 ROAD|true but incomplete|I tried. I was not strong enough.
 TAYJ|radio|That does not tell us how it started.
 ROAD|withholding|The first prison does. I will take you there before you must choose.
 CAL|angry|You keep deciding what we get to know.
 ROAD|quiet shame|Yes. I have.'''),
 scene('Check in before going in','At camp, follow TayJ handing Cal a paired recorder while Tay checks his old injury. Riped watches the exit code being agreed. Cal and Riped will search the archive while Tay and TayJ maintain the outside contact route.',
 '''TAYJ|clear|Miss one check-in, we call. Miss two, we use the service entrance. No heroic guessing.
 TAY|to Cal|And if the old wound pulls, you say so before it changes your footing.
 CAL|slightly defensive, then honest|I will.
 RIPED|cocky|You have me. Nothing happens without me noticing.
 TAYJ|dry|Then notice the second transmitter and leave it switched on.
 CAL|to Riped|We get the records. We do not split up.
 RIPED|too agreeable|Would not dream of it.
 ROAD|faint warning|The building is not empty.''')])

mission('M18','Abandoned','Chapter 6 - The Empty Cell',60,'government','ARCHIVE','HOLDING',
 'Search an allegedly abandoned government building with Riped and suffer a staged ambush.',
 [('Search the public offices','Recover a current transfer index and signs of recent occupation.'),('Reach the secure wing','Open a manual archive gate after a warning about active defenses.'),('Survive the ambush','Retreat toward cover; scripted capture follows without pretending it was avoidable.')],
 ('warm_terminal','The terminal fan is running beneath the dusty counter.'),
 'Stealth or cautious entry changes recovered supplies. This is a clearly staged capture sequence, not punishment for choosing the wrong route.',
 'Save before entry and after capture. Preserve all evidence in journal; confiscated physical gear is recoverable in M20.',[
 scene('Dust with footprints','Follow Cal and Riped through the lobby, 6 seconds, framing fresh boot marks crossing dust. A 3-second focus on the running terminal fan hints that the building is occupied. Player can retreat to check equipment before committing.',
 '''CAL|low|Somebody has been through here today.
 RIPED|dismissive|Scavengers. Do not jump at every footprint.
 TAYJ|radio|Your building is drawing power. Not much, but it is current.
 CAL|alert|We stay together.
 RIPED|too loud|Obviously. Records are this way.
 CAL|suspicious|You sound sure.
 RIPED|covering|It says archive on the wall, Cal.
 TAYJ|radio|Second transmitter is fading. Check the cable before the wing.'''),
 scene('The living index','Secure archive. Player photographs a present-day Grevyn transfer record and Grandpa\'s conditioning authorization. A camera follow tracks Cal returning toward the exit, not deeper into an invisible trigger. Door movement and footfalls warn of the ambush.',
 '''CAL|reading|Current transfer. Subject retained for reconstruction command.
 RIPED|trying to redirect|Take the page and move.
 CAL|quiet shock|Grandpa Gucki signed the authorization himself.
 VOSS|from doorway|Set the record down, Reed.
 CAL|turning|You knew we were coming.
 VOSS|controlled|Hands visible. Nobody needs to demonstrate courage.
 RIPED|performing surprise|What the hell is this?
 TAYJ|broken radio|Cal, answer. Cal—'''),
 scene('Capture','Gameplay offers a short, survivable retreat to cover; capture is the authored endpoint. Voss orders nonlethal restraint. Cut from Cal reaching a blocked exit to an intake table with a clear time transition. Do not force a long unwinnable shootout.',
 '''CAL|to Riped|Back door. Stay behind me.
 RIPED|panicked performance|It is locked!
 VOSS|to unseen troopers|Alive. The commander wants the witness alive.
 CAL|furious|You do not get to call her that again.
 VOSS|calm|You may explain your preferences in intake.
 RIPED|too rehearsed|We came for abandoned records. That is all.
 CAL|as restrained|Tell them nothing.
 VOSS|quiet threat|Your friend understands the procedure.''')])

mission('M19','Intake','Chapter 6 - The Empty Cell',60,'holding','PRISON','HOLDING',
 'Observe detention routines, retain evidence and start an escape without knowing Riped was released.',
 [('Learn the routine','Inspect cell, service hatch and guard-change sounds.'),('Contact Riped','Speak through the wall before his covert removal.'),('Reach the service corridor','Use a maintenance access during a power interruption.')],
 ('service_hatch','Cool air comes through the lower maintenance grille.'),
 'Cal can request Road Force help after seeing its cost or use the mechanical route. Both keep a later recovery path.',
 'No real-time solitary wait. Interactions advance routines. Captured evidence is copied, not deleted; later item restitution is idempotent.',[
 scene('Two cells','Camera follows Cal into a ground-level cell, never through locked walls. Riped is heard in an adjacent cell. A tray scrape and distant transformer identify the mechanical escape route. No audience-only release scene yet.',
 '''VOSS|procedural|You will be asked about the archive. You will answer the question asked.
 CAL|defiant|I have heard that speech. I helped you make people listen to it.
 VOSS|untroubled|Then you know its value.
 RIPED|through wall, false bravado|Cal! I told them this is a misunderstanding.
 CAL|low|Stop telling them things.
 RIPED|injured pride|I am trying to get us out.
 CAL|serious|Wait for a chance. I am not leaving you in here.
 RIPED|after a pause|Right. Of course.'''),
 scene('A quieter offer','Receiver recovered from a gap in intake wiring carries the Road Force. Player can instead use a metal bed fastener to open the grille. The camera hints at moving dust near the vent only after Cal examines airflow.',
 '''ROAD|weakened|I can break the latch. It will cost another measure.
 CAL|whispering|You said we would need you at the end.
 ROAD|plain|You will. There is also a service fastener beneath the bed.
 CAL|skeptical gratitude|An actual useful answer. Keep doing that.
 TAYJ|brief paired signal|Two knocks if you hear. Do not answer by voice.
 CAL|under his breath, relieved|TayJ.
 TAY|distant signal fragment|Alive is enough. We are working on the rest.
 CAL|steadier|So am I.'''),
 scene('The corridor','After the hatch opens, track Cal crouching into the service corridor for 5 seconds, ending before a junction decision. An empty stretcher and disconnected camera lead toward confiscated property. Far off, a controlled blast masks Riped\'s staged cell breach.',
 '''CAL|quiet, to himself|Property room first. Then Riped.
 SABLE|from another locked room|If you are a guard, you have taken a very strange route.
 CAL|quiet surprise|Dr. Nadir?
 SABLE|suspicious|That depends who is asking.
 CAL|urgent but honest|Callum Reed. We found Grevyn\'s research. I need help getting her out.
 SABLE|after a beat|Then do not touch the dosing cabinet. Start with my door.
 CAL|reassuring|I am coming back for you.
 SABLE|firm|Say where and when. People say back very easily in here.''')])

mission('M20','The Hole in the Wall','Chapter 6 - The Empty Cell',60,'holding','PRISON','EMPTY_CELL',
 'Recover gear and find Riped\'s apparently blasted-open cell, mistaking a staged release for escape.',
 [('Recover confiscated items','Open property storage and reconcile every essential item.'),('Reach Riped\'s cell','Inspect the empty room and outward-blown wall.'),('Commit to extraction','Leave a rendezvous mark and return for Sable and the other prisoners.')],
 ('riped_cell','Dust on the floor changes near the service wing; follow the numbered cell signs.'),
 'Cal may notice the unusual blast but lacks enough proof yet. He reasonably assumes Riped escaped; do not make him ignore obvious evidence.',
 'Essential inventory ledger restores each item once. Cell evidence can be revisited in final disclosure; no hidden inspection requirement for a good ending.',[
 scene('Everything they took','Follow Cal opening the property cage, then insert the stamped seizure list beside his kit. Player checks essential cargo and recorder. Archived scans remain intact even if a noncritical item is absent.',
 '''CAL|reading|Recorder. Journal. Medical case. They logged everything except a conscience.
 TAYJ|faint radio|Cal? Short answers. Where are you?
 CAL|relieved, controlled|Property storage. Alive. Sable is here. Riped is next.
 TAYJ|radio|Service exit south. Dain has the van. Tay is preparing seats.
 CAL|asking|Any signal from Riped?
 TAYJ|radio|Nothing on the agreed channel.
 CAL|concern overriding dislike|Then I find him.
 TAYJ|firm|And come back. That part stays in the plan.'''),
 scene('An exit made for one','Camera follows Cal to Riped\'s cell, 5 seconds; widen to reveal the broken wall. No suspicious dossier conveniently explains everything. Blast residue and undamaged latch can be examined but are marked ambiguous until later release documents.',
 '''CAL|calling softly|Riped?
 CAL|seeing breach|He got out. Bastard actually got out.
 ROAD|quiet, uncertain|A wall was opened. That is all I can tell you.
 CAL|trying to trust the practical reading|He must have found charges in the service wing.
 TAYJ|radio|Maybe. Take a picture. Keep the questions for daylight.
 CAL|thinking aloud|Latch is still intact. Could have been the only way.
 TAYJ|radio|We do not have his route. We do have people waiting for yours.
 CAL|deciding|I will leave the rendezvous mark. Then Sable.'''),
 scene('Not waiting for a ghost','Cal places the crew\'s rendezvous strip outside the breach; camera follows his hand back to the escape corridor, returning control before enemy patrols resume. No objective suggests Riped actually died or genuinely escaped.',
 '''CAL|recording message|Riped, south service road. We have a van. Use the second channel.
 TAY|radio|We have room. Bring whoever can walk, we will help the rest.
 SABLE|from doorway|I heard a blast. Are they opening cells or destroying records?
 CAL|honest|I do not know yet.
 SABLE|grim|Good. Keep saying that when it is true.
 CAL|resolute|I promised to come back. Here I am.
 SABLE|believing the action|Then help me with this lock.
 ROAD|soft|This time someone can see you returned.''')])

mission('M21','Bring Someone With You','Chapter 6 - The Empty Cell',60,'holding','EVAC','EXTRACTION',
 'Free Sable and other detainees, evacuate with the crew and discover enough release evidence to suspect Riped.',
 [('Free the clinic wing','Open the service locks and move injured detainees to cover.'),('Reach the extraction','Use either prepared road; escort without fragile-NPC fail states.'),('Treat and debrief','Stabilize escapees, verify research and decode a partial release entry.')],
 ('lock_feed','The clinic locks share the labelled service breaker, separate from life support.'),
 'Quiet release or public diversion affects pursuit pressure. Both save all reachable captives; no reward for abandoning an injured prisoner.',
 'Downed allies receive assisted movement; rescue checkpoint preserves evacuee count. Replacements for lost Paste supplies are offered explicitly.',[
 scene('Not an experiment','Follow Sable leaving her room at normal speed, stopping to assist another detainee. Player disconnects only labelled lock power. A shot along the corridor shows both cover and the service exit before pursuit starts.',
 '''SABLE|urgent instruction|That switch runs the monitors. The lower one runs the locks. Do not guess.
 CAL|checking label|Lower breaker. Locks only.
 SABLE|steady|Good. We are not proving a point with someone else\'s pulse.
 TAY|radio|Tell me injuries before you move them.
 CAL|listing observations|Two walking, one needs support. One cannot bear weight.
 TAY|radio|Dain is bringing the stretcher. Stay behind the concrete divider.
 TAYJ|radio|Service road open. We have your signal.
 CAL|to Sable|Nobody here has to earn their seat.'''),
 scene('The van','Track the stretcher from behind at walking pace for 6 seconds while Dain and Tay load it. No camera hijack during active fire: this shot begins only after the doors and smoke screen secure the loading bay. Gameplay then controls the escape drive.',
 '''DAIN|working|Brake on. Doors wide. Watch the step.
 TAY|to Cal|You sit for the first stretch. Your hands are shaking.
 CAL|trying to argue|I can drive.
 TAY|firm|You can. You do not have to.
 SABLE|to Tay|I can monitor from the rear. I am a doctor when nobody is holding a gun to the chart.
 TAY|respectful|Then tell me what you need.
 TAYJ|radio|First checkpoint cleared. Riped still is not answering.
 CAL|worried, suspicious|Keep trying. Keep the log.'''),
 scene('A release, not a breach','Safe clinic debrief. A partially recovered release ledger marks Riped\'s cell cleared before the blast; not yet a full confession. Camera focuses on the two timestamps only after decoding. Sable recognizes Grevyn\'s corrections and supports a real plan.',
 '''TAYJ|careful|His cell was cleared before the wall came down. The authorization field is damaged.
 CAL|processing|They moved him first. Or he got the guard to log an escape early.
 TAYJ|agreeing on uncertainty|Both possible. Neither matches what we saw.
 SABLE|reading notebook|These corrections are hers. She tried to keep a version they could not make her destroy.
 CAL|hope with limits|Can you finish it?
 SABLE|honest|With verified stock and an activated catalyst, yes. It will support her, not undo years in a night.
 TAY|decisive|Then we give her the best chance we can prepare.
 CAL|quietly to TayJ|And we find out who opened his cell.''')])

mission('M22','The Catalyst','Chapter 7 - What the Road Remembers',80,'catalyst','STORM','CATALYST',
 'Retrieve a fictional field catalyst from a contaminated road research station.',
 [('Survey the station','Read the hazard chart and isolate a safe path using portable sensors.'),('Recover the inert core','Disable two field relays, then transport the catalyst in its shielded case.'),('Exit without exposure','Navigate a displaced-road anomaly with TayJ\'s physical landmarks.')],
 ('inert_core','Only the socket with the unlit outer ring is safe to open.'),
 'Restore a passive bypass or request a priced Road Force intervention. Grevyn\'s survival never depends on an unannounced early test.',
 'Anomaly resets move the truck to the last stable turnout, preserving cargo. No flashing navigation dependency; labels and tones duplicate color.',[
 scene('Roads that disagree','Track the crew stopping before an impossible road split. The wide shot shows one physical barrier and two inconsistent horizons. On-foot sensors reveal stable ground; the camera never points the player into an active lethal zone.',
 '''TAYJ|radio|Ignore the horizon for a moment. Read the posts. Three close, one broken.
 CAL|uneasy|I drove past the broken one twice.
 ROAD|strained|The field folds what you expect to see. The posts are still where people put them.
 SABLE|practical|We use measurements, not a feeling of certainty.
 DAIN|radio|I marked the truck position with a cable. Follow it back if the road moves.
 CAL|breathing through anxiety|Posts. Cable. Receiver. Things we can check.
 TAY|radio|And us. You can still hear us.
 CAL|steadier|I can.'''),
 scene('An inert piece of a bargain','Follow Cal carrying the shielded case from station entrance to workbench at 1 m/s; insert the unlit ring only after he reads the socket instructions. The catalyst is invented supernatural material, never described as a real extract or chemical.',
 '''SABLE|radio|It is inert here. It needs the Road Force\'s field to take the corrected structure.
 CAL|skeptical|So we cannot just find another one later?
 SABLE|clear|We can replace the housing. This core is the one verified in Grevyn\'s work.
 ROAD|quiet|I can activate it. That will cost more than moving a gate.
 CAL|direct|You tell us the cost before we do it.
 ROAD|accepting|At the ridge station. With your meter watching.
 TAYJ|radio|Core number matches. Closing the ledger entry, not the case until you say.
 CAL|working|Case latched. Both handles. Moving.'''),
 scene('The way back is marked','A short rear vehicle follow shows Dain\'s cable and marker posts, then returns full drive control. Optional rescue of trapped scavengers costs route time only; passive repair earns a stored capacitor that can later replace depleted reserve.',
 '''DAIN|radio|Your rear wheels are clear. Slow left past the broken post.
 CAL|tired joke|Which left? The road has developed opinions.
 TAYJ|dry|Your left. I have not issued the road voting rights.
 TAY|radio|The station crew are at the fence. We can bring them to the crossing.
 CAL|deciding|Mark the stable path for them. Nobody follows an illusion out.
 SABLE|quiet admiration|Grevyn wrote that, too. Leave a route someone else can use.
 CAL|soft|She used to hate when people erased their workings.
 ROAD|faint|Then keep yours.''')])

mission('M23','What the Road Gives','Chapter 7 - What the Road Remembers',80,'ridge','ROAD_DUSK','ROAD_FORCE',
 'Activate the catalyst with informed consent and establish concrete reserve recovery options.',
 [('Prepare the test rig','Install a receiver, shield and field meter.'),('Authorize activation','See the reserve cost, then activate or first rebuild capacitor support.'),('Store the result','Verify field polarity, seal the core and record the remaining reserve.')],
 ('field_meter','The meter is connected only when both labelled leads are seated.'),
 'Activation costs two reserve units. Optional capacitors add equivalent severing capacity, not life to the Road Force. Restore enough before final consent.',
 'The essential catalyst cannot be permanently destroyed. Failed housing checks return it inert for a safe repeat without double-charging reserve.',[
 scene('Before the meter moves','Ridge workbench at dusk. Track TayJ fitting the meter, then hold a wide showing Road Force\'s amber field separate from the blue sealed catalyst. Player sees the exact cost panel before choosing.',
 '''TAYJ|precise|Meter stable. Receiver isolated from the vehicle battery.
 ROAD|plain|Activation takes two measures. I have no way to take them back.
 CAL|checking|Can the prison equipment make up the difference later?
 ROAD|honest|Its stored field can help the severing. It cannot make me whole.
 SABLE|clear|Then we record both. Your strength and the equipment\'s capacity are different supplies.
 TAY|to Cal|We can rebuild the capacitors first if you want the safer margin.
 CAL|to Road Force|No surprises after I say yes.
 ROAD|quiet|None about this cost.'''),
 scene('Activation','Six-second still-wide transformation, then 4-second close view of catalyst bands stabilizing. Amber filaments pass into the core; receiver reserve falls by exactly two once success commits. Reduced-flash option substitutes steady illumination and a low tone.',
 '''ROAD|working, strained|Keep the corrected pattern steady. Not the old one.
 SABLE|watching|Corrected pattern locked. Body support isolated.
 TAYJ|reporting|Reserve falling. One measure. Two. Holding.
 CAL|concerned|Stop if it keeps falling.
 ROAD|after effort|It has stopped.
 TAY|checking Cal and the rig|Everybody breathe. Nobody touch the hot housing.
 SABLE|relieved|Activated. We can finish the substitute.
 CAL|to the force, quiet|You sound farther away.'''),
 scene('A debt made visible','Follow Cal putting the catalyst into the secured cradle. If reserve is below final threshold, TayJ points to an explicit capacitor rebuild task before travel resumes. No invented successful asset or audio claim: these are screenplay cues for future production.',
 '''ROAD|weaker|I am less here than I was.
 CAL|angry sadness|You could have said that without making it sound like a riddle.
 ROAD|accepting|You are right.
 TAYJ|radio|Two prison capacitors will restore the working margin. I marked the salvage stops.
 SABLE|firm|We do not count the substitute finished until we test the full support sequence.
 CAL|steady|Then we test it. And we go to your first prison.
 ROAD|quiet|There is something there I should have told you already.
 CAL|hard|Yes. I think there is.''')])

mission('M24','Finish Her Work','Chapter 7 - What the Road Remembers',80,'workshop','LAB_WARM','GOLGHIS',
 'Prepare verified Golghis Paste and give explicit opportunities to replace anything lost or skipped.',
 [('Audit missing work','Compare corrections, stock seals, catalyst and specialist review in a four-part ledger.'),('Recover gaps','Complete any missing-page, replacement-stock or capacitor salvage tasks.'),('Prepare and verify','Let Sable and Tay run Grevyn\'s fictional three-check process and seal doses.')],
 ('verification_tray','The blank verification cards are beside Grevyn\'s corrected index.'),
 'A planned batch requires all checks. An incomplete batch is labelled emergency-only, with a later final repair opportunity.',
 'No irreversible commit here. Missing Sable is resolved by returning to the service route; in this linear story her rescue is mandatory.',[
 scene('Everything on the bench','Slow lateral follow along supplies to Grevyn\'s notebook, ending on the empty verification cards. UI explicitly lists each missing prerequisite and exact recovery objective. No vague readiness percentage.',
 '''SABLE|methodical|Corrected sequence. Verified support. Activated catalyst. Clean sealed carrier.
 TAY|checking|I have the body-support chart and a second observer for each check.
 CAL|asking plainly|What are we missing?
 SABLE|COMPLETE|Nothing essential. We can prepare the planned batch.
 SABLE|INCOMPLETE|The ledger marks the gaps. We can repair them before we ask her to risk this.
 TAYJ|radio|Every marked replacement stop has a route and enough fuel to reach it.
 DAIN|supportive|Truck is not leaving because somebody gets impatient.
 CAL|deciding|Show me the list.'''),
 scene('Golghis','Preparation montage follows hands, labels and verification lights, not a real actionable recipe. Three brief inserts are separated by playable equipment checks. Grevyn\'s recorded words guide the work. The music is warm but unresolved.',
 '''GREVYN|research recording|First check is support without field reinforcement. Do not let a quiet room fool you.
 SABLE|after test|Support holding. Field not rising.
 GREVYN|recording|Second is separation under load. Third is recovery. Write down failures. Especially the ones you want to ignore.
 TAY|after test|Recovery within her corrected range.
 CAL|softly to the notebook|We are writing it down.
 SABLE|COMPLETE|Verified batch. It is ready for monitored use.
 SABLE|INCOMPLETE|Provisional only. It is not safe to call this the planned treatment.
 CAL|shared|The label says what it is. No better story than the facts.'''),
 scene('Not a cure for everything','After the batch is sealed, follow Cal taking a meal with the crew. He may ask to sit with Tay, call TayJ or rest alone with a scheduled check-in. These are characterization choices, not an approval test.',
 '''CAL|exhausted|When this is done, is she going to be herself?
 SABLE|gentle honesty|She is herself now, under coercion and injury. Recovery is not returning a machine to factory settings.
 TAY|firm|And she might not want the same life you remember.
 CAL|thinking|Neither do I, some days.
 TAYJ|radio|We can still want a next day.
 DAIN|bringing food|Start with the next hour. Soup. Then sleep.
 CAL|small gratitude|You are all getting very good at ordering me around.
 TAY|warm|Only when you outsource basic maintenance.''')])

mission('M25','The First Prison','Chapter 8 - The Road\'s Bargain',80,'firstprison','CONTAINMENT','FIRST_PRISON',
 'Survey the original Road Force containment site and prepare it for voluntary severing instead of imprisonment.',
 [('Reach the site','Drive the service access and verify a stable medical vehicle route.'),('Survey the equipment','Inspect three field clamps, the manual bypass and accessible treatment platform.'),('Make it usable','Repair floor access, lighting and reserve capacitor mounts.')],
 ('manual_bypass','The release wheel is painted on both sides; it was built to turn from inside as well.'),
 'Dismantle coercive locks while retaining field guidance. Never present rebuilding a prison as morally neutral treatment.',
 'Site geometry is single-storey to match current engine constraints. All critical paths have accessible ramps and redundant manual releases.',[
 scene('The place it remembers','Wide approach from the truck, then follow Cal and TayJ through a ground-level service door. The camera pauses at inside-facing manual release markings. Amber Road Force presence is thin here, not triumphant.',
 '''ROAD|uneasy|This is where they held me.
 CAL|looking around|You want to bring her into another cage?
 ROAD|plain|I want to use what can guide the field. Not what made escape impossible.
 TAYJ|firm|Then the release stays reachable from both sides.
 TAY|looking at platform|And nobody straps her down because it is convenient.
 SABLE|agreeing|Medical support and field control are different systems. We keep them separate.
 DAIN|at the door|I can take these locks out without taking the frame down.
 CAL|decisive|Do it.'''),
 scene('A room with exits','Playable repairs. A 5-second tracking shot follows Dain pushing a stretcher along the complete entrance-to-platform route, demonstrating usable clearance. A 3-second insert hints at a broken capacitor mount only after the system survey.',
 '''DAIN|working|No raised threshold. No blind corner. We can roll someone out without turning them upright.
 TAY|pleased|That matters more than making it look impressive.
 TAYJ|reading meter|Guidance clamps intact. Reserve storage is not.
 CAL|checking|We can salvage the replacements marked at the ridge?
 TAYJ|clear|Yes. And test them here before we commit.
 ROAD|weak|Enough stored capacity will keep my earlier losses from deciding her fate.
 CAL|hard|Good. Because she never got a say in those either.
 ROAD|quiet|No. She did not.'''),
 scene('The old recording','Player opens a sealed historical recorder. It identifies the Road Force\'s bargain but stops before its full confession; next mission provides corroboration. Camera follows Cal taking the recorder outside for a crew conversation, not a surprise jump scare.',
 '''MERRIN|historical recording|We can break the containment. In return, you put us in contact with the other presence.
 ROAD|historical recording, stronger|I can open a way. You do not understand what may answer.
 MERRIN|historical recording|Then help us understand it after you are free.
 CAL|stunned|That was you.
 ROAD|present, very quiet|Yes.
 TAYJ|to the receiver|We are keeping the whole recording.
 CAL|controlled fury|No riddles. No more tomorrow. Tell us now.
 ROAD|accepting|I will.''')])

mission('M26','The Bargain','Chapter 8 - The Road\'s Bargain',80,'firstprison','ARCHIVE','CONFESSION',
 'Expose the Road Force\'s responsibility and independently verify its failed intervention.',
 [('Hear the full admission','Listen with the crew and ask direct follow-up questions.'),('Corroborate the history','Compare resistance logs, containment damage and experiment dates.'),('Decide working trust','Set explicit consent and disclosure terms for continued cooperation.')],
 ('damage_log','The attempted shutdown is dated after the first exposure, before Grevyn\'s transfer.'),
 'Forgive, cooperate without forgiveness or remain openly distrustful. All retain the rescue route; forgiveness is not a survival key.',
 'No irreversible decision until the confession and corroboration are in the journal. Skipping the cinematic preserves a full readable summary.',[
 scene('What freedom cost','Static group composition in the dismantled containment room. The Road Force speaks without a beautiful visual distraction. Camera holds on listeners between lines. Its explanation does not claim it intended the experiments.',
 '''ROAD|ashamed, plain|They had weakened me until I could barely reach beyond this room. I offered contact with the other force for my freedom.
 CAL|angry|You opened the way.
 ROAD|plain|Yes.
 TAY|pressing|Did you know they would use people?
 ROAD|no excuse|Not then. I knew the other presence was dangerous. I wanted to be free more than I wanted to keep asking.
 CAL|hurt fury|Grevyn paid for what you stopped asking.
 ROAD|accepting|Yes.
 TAYJ|precise|When did you find out? Not when you felt bad. When did you know?'''),
 scene('An attempt that did not erase it','Player compares three independent logs. A brief object-focused shot shows fused relay contacts corresponding to a documented shutdown attempt. Road Force\'s failure is true and does not undo its initiating bargain.',
 '''ROAD|measured|While the experiments were happening. I tried to break the field and remove the subjects. I failed.
 MERRIN|recorded testimony|The road presence cut our supply feed. We rebuilt it under regime protection.
 SABLE|checking dates|That matches the failure log. It does not clear either of them.
 CAL|bitter|You wanted me to trust you before I knew any of this.
 ROAD|honest|I feared you would leave her if you learned why I knew where she was.
 CAL|firm|You do not get to make that choice for me.
 TAYJ|to the force|From here: cost, risk, alternatives. Before, not after.
 ROAD|quiet|Agreed.'''),
 scene('Work without absolution','Player chooses Cal\'s response. Camera remains at eye level and returns before selection. Crew support is not withdrawn for anger. A working compact is written beside the rescue checklist.',
 '''CAL|FORGIVE|I believe you tried. I am not ready to call this all right.
 CAL|COOPERATE|I will work with you to help her. That is not forgiveness.
 CAL|DISTRUST|I do not trust you. TayJ checks every claim, and you answer every question.
 ROAD|shared|Those are terms I can accept.
 TAY|shared|Grevyn gets the same truth when she can hear it safely.
 CAL|shared|All of it. Even if she tells us to leave.
 SABLE|shared|Then we plan a treatment she can understand, not another bargain made over her.
 ROAD|shared, low|That is what I should have done before.''')])

mission('M27','Terms of the Rescue','Chapter 8 - The Road\'s Bargain',80,'firstprison','CONTAINMENT','TERMS',
 'Rehearse severing, disclose the sacrifice cost and verify a guaranteed preparation route remains open.',
 [('Run a dry test','Test support and containment separately without a person on the platform.'),('Learn all three routes','Review prepared severing, emergency treatment and fatal transfer.'),('Finish staging','Place a spare vehicle, medical support and power reserve; leave a recovery itinerary.')],
 ('test_dummy','The weighted test cradle is for equipment checks, not a person.'),
 'Choose an intended plan now, revisable at M35. Explain that transfer kills Cal, and successful severing consumes the Road Force.',
 'Display unmet conditions and routes to fix them. Do not permit a ceremonial yes to silently lock a later sacrifice.',[
 scene('The empty platform','Follow Cal wheeling a test cradle into position, then step out to a wide view of clear exits and manual releases. Run no live field against a person. Each indicator has a text label and sound distinct from an alarm.',
 '''TAYJ|testing|Guidance stable. Manual release works from the platform.
 TAY|testing|Body support remains on when guidance is cut. That is the separation we need.
 SABLE|to Cal|A successful test is evidence. It is not consent from the person who will use it.
 CAL|clear|We ask her when she can answer.
 ROAD|quiet|There is another cost you need to know.
 CAL|bracing|Then say it now.
 ROAD|plain|A complete severing will consume what remains of me.
 TAYJ|after a beat|That goes in the plan too.'''),
 scene('The choice nobody owes','Static table conversation. Explicit fatal-sacrifice explanation, no heroic swell urging selection. Player can ask again. The supernatural transfer mechanism is stated as a voluntary channel, not a blood ritual or real-world method.',
 '''ROAD|clear|If her bond cannot be severed safely, you could take its connection into yourself. I could destroy it there.
 CAL|direct|And me.
 ROAD|plain|Yes. You would die. She would still need bodily support.
 TAY|firm, emotional|You are not a spare part, Cal. Do not decide that because you are tired or guilty.
 SABLE|clinical kindness|Prepared Golghis and working equipment can let both of you live. That route is still open.
 CAL|grounded|I want that route. I want to live.
 TAYJ|steady|Then we keep building it.
 ROAD|accepting|No one owes this sacrifice. Not even to repair what I did.'''),
 scene('Leave a way back','Follow TayJ placing the recovery itinerary on the truck dashboard. Player stages fuel, replacement parts and a second receiver. No hidden force-reserve requirement remains after this inspection.',
 '''DAIN|checking|Return fuel sealed. Spare battery charged. Truck can leave without the station grid.
 TAYJ|checking|If we have to come back for supplies, we know exactly where.
 TAY|to Cal|And if you change your mind, you say it. Even at the last moment before the procedure.
 CAL|quiet gratitude|I hear you.
 SABLE|ready|We have a plan. We do not have to pretend it is easy.
 ROAD|faint|She is at the reconstruction facility now. The other force is keeping her close.
 CAL|guarded|Then we find her. And we let her speak.
 TAYJ|radio|Crew check. Everybody here.''')])

mission('M28','The Regime\'s Future','Chapter 9 - Someone She Trusted',80,'citadel','REGIME','REGIME',
 'Enter the reconstruction complex and expose Grandpa Gucki\'s bargain with the Dominion.',
 [('Approach with faction support','Use earned civilian routes or complete a local service bypass.'),('Collect the command record','Recover Grandpa\'s knowing authorization and current conditioning orders.'),('Reach the audience wing','Disable the perimeter relay without cutting medical support.')],
 ('command_record','The signed authorization is in the command desk\'s locked side drawer.'),
 'Publicly release regime orders with protected victim identities or deliver them to independent settlements. Both preserve accountability.',
 'No forced combat loadout. Support, stealth and vehicle diversion routes reach the same protected rendezvous.',[
 scene('A government rebuilding itself','Wide shows the complex\'s flags and restored power grid. Follow Cal moving past a truck checkpoint using the chosen route; never reveal a free-roam roadblock as this fixed authored site. Propaganda music is diegetic and can be muted separately.',
 '''GUCKI|public recording|The roads will be one road. The people will be one people. Protection begins with obedience.
 CAL|quiet anger|He still calls it protection.
 TAYJ|radio|The settlements gave us a service route. They did not give him their consent.
 DAIN|radio|Diversion truck ready if you need it.
 TAY|radio|Medical line stays live. I am watching its feed.
 CAL|checking|Perimeter only. We do not cut life support to make an entrance.
 ROAD|faint|The other presence is here.
 CAL|to it|Then stay with what you can prove. We are past trusting a feeling.'''),
 scene('A willing bargain','Command records and a recent recorded confrontation reveal both parties. Shot over Cal\'s shoulder keeps the document readable; cut to the screen only when he chooses playback. Grandpa is not an innocent possessed leader.',
 '''GUCKI|recorded, private|You said the conditioned population would hold the field. I kept the dosing program alive.
 EVIL|recorded, calm|And they obeyed because they feared what came without it. Your state has been generous.
 GUCKI|recorded|It is my state.
 EVIL|recorded|That is the phrase which made you easiest to keep.
 CAL|after recording|He knew. He kept paying it with people.
 SABLE|radio|And Grevyn was meant to make the next generation of the system stable.
 TAYJ|radio|Record secured. Victim identities protected before transmission.
 CAL|grim|Then he does not get to say he was deceived.'''),
 scene('The friend already inside','Audience-wing door. Riped\'s voice is audible ahead, calling Cal dangerous. Follow Cal to the doorway for 4 seconds; stop before he can see Grevyn. Return control for the final medical and evidence check.',
 '''RIPED|offscreen, persuading|He has been collecting weapons and stories. I tried to stop him. He thinks you are not yourself.
 GREVYN|offscreen, conditioned but wavering|Cal would not come this far without a reason.
 RIPED|offscreen|Exactly. Do not let him get close.
 CAL|under his breath|Riped.
 TAYJ|radio, alarm held down|He did not use the rendezvous. He came here.
 TAY|radio|Cal, breathe. Do not walk in angry with your hands full.
 CAL|steadying|Evidence case. Empty hands. Let her see me.
 ROAD|weak|I can keep a path open. I cannot choose what she hears.''')])

mission('M29','You Never Came Back','Chapter 9 - Someone She Trusted',80,'citadel','STORM_INTERIOR','REUNION',
 'Meet the living, changed Grevyn; present the frame-up evidence while respecting her distance and disbelief.',
 [('Approach without force','Place weapons outside the room and remain behind Grevyn\'s marked distance.'),('Present a full chronology','Offer originals, unedited audio, false voucher and treatment records.'),('Make room for truth','Show Cal\'s scar only with consent and let Grevyn question both men.')],
 ('evidence_table','The clear table is outside Grevyn\'s reach line; set the case there.'),
 'Cal can be hurt, angry or measured; no exact phrase makes her magically trust him. All corroborated evidence reaches her.',
 'Dialogue selection is untimed. A tense camera is not a QTE. If skipped, required facts still display before the next authored scene.',[
 scene('Cal','Grevyn stands at the far end of a damaged audience hall. Slowly track behind Cal entering, then settle into a wide with Riped between them. Her use of Cal triggers his anxiety; the camera steadies instead of simulating dizziness without permission.',
 '''GREVYN|controlled, cold familiarity|Cal.
 CAL|breath catches, then grounded|Do not— I need a second.
 RIPED|mock concern|See? He is not ready for this.
 CAL|firm to him|You do not get to speak for me.
 GREVYN|hurt under conditioning|You did not come back. Do not come here and call that care.
 CAL|honest|I tried. I also said things on that call I wish I had not said.
 GREVYN|hard|You told me fine.
 CAL|accepting|I did. It was anger. It was not permission for what they did to you.
 GREVYN|guarded|Put the case down. Stay there.'''),
 scene('Everything except a verdict','Object-by-object evidence sequence. Cal walks only to the agreed table. Inserts show paired documents and full audio; camera returns to Grevyn between exhibits, allowing her to react and ask. No friendship montage substitutes for proof.',
 '''CAL|careful|This is the protective request. This is the version they filed. Same signature. Different order.
 GREVYN|distrustful|You could have made that after.
 TAYJ|radio, identified|The carbon predates the detention. The archive kept both. You can check the custody marks.
 RIPED|interrupting|She is helping him tell a story.
 GREVYN|sharp to Riped|Let her finish.
 CAL|steady|The full radio channel. The civilian note with its patient sheet. The payment voucher copied from another account.
 GREVYN|angry confusion|They showed me your handwriting.
 CAL|quiet|It was mine. The lie was what they put around it.
 TAY|radio|And these are my treatment notes from the night he tried to reach you.
 GREVYN|voice smaller|You were there?'''),
 scene('Where he was hit','Cal asks before showing the healed gunshot scar. Brief neutral framing, then dress restored. The treatment card and rescue route remain visible; the script explicitly does not treat a scar as proof of who framed him. Riped feels his explanation slipping.',
 '''CAL|asking|I can show you where I was shot. Do you want to see?
 GREVYN|after a pause|Yes.
 CAL|showing, not pleading|Second road. The first was destroyed. The western one was blocked.
 TAYJ|radio|We have the route and the time we picked him up. They match the treatment record.
 GREVYN|shaken, fighting the imposed memory|I remember you not coming. I remember hearing you. I cannot make it stop changing.
 CAL|gentle but not forgiving everything|You do not have to fix the memory to read what happened.
 RIPED|losing patience|Enough. He has dragged everybody into this because he cannot bear being the bad guy.
 GREVYN|to Riped, new suspicion|Why did you tell me he wanted me dead?
 RIPED|too quick|Because I know him.
 CAL|quiet|Then tell her what you knew about Drywell.''')])

mission('M30','The Informer','Chapter 9 - Someone She Trusted',80,'citadel','STORM_INTERIOR','INFORMER',
 'Expose Riped\'s betrayal; stage Grevyn\'s lethal rage, injurious fall, brief lucid reunion and renewed control.',
 [('Corroborate the release','Let TayJ deliver the restored prison release authorization.'),('Hear the confession','Riped reveals the private details and jealousy while believing Grevyn cannot hear.'),('Reach Grevyn after the fall','Allow Tay to stabilize her after she kills Riped and loses consciousness.')],
 ('release_audio','The restored release entry arrives on the paired receiver; play it at the table.'),
 'No kill-or-spare Riped choice: his death is fixed canon. Cal can protest or freeze, neither is graded as consent.',
 'Checkpoint before confession and after stabilization. Non-graphic fatal impact. Grevyn\'s severe injuries persist through every later mission.',[
 scene('A wall opened for him','A brief power surge partitions the hall with translucent field geometry. Grevyn appears withdrawn; Riped believes she cannot hear. Keep sightlines intelligible in a wide. TayJ plays Voss\'s release order before Riped speaks.',
 '''TAYJ|radio, precise|Release authorization restored. Riped, cooperation agreement. Cell breach scheduled after transfer.
 VOSS|recorded order|Release the cooperating witness. Open his wall after removal. Reed is to believe he escaped.
 CAL|quiet devastation|You let me go looking for your cell.
 RIPED|mask falling|And you did. Even then. You always need to be the person who comes back.
 CAL|anger|You knew she was alive.
 RIPED|flat|Of course I knew. You would never have stopped if I had told you.
 CAL|hard|Why?
 RIPED|bitter|Because there was never room for anyone else when she had you.'''),
 scene('The detail only one friend should know','Tight two-shot Cal and Riped, then reveal Grevyn listening beyond the field. Riped names every private detail he overheard and the planted evidence; not a magical truth spell. His jealousy explains motive without excusing it.',
 '''RIPED|cruel confidence|Behind the history map. Save me the window seat. Drywell, western canopy, service road. You said it all in one conversation.
 CAL|stunned|You were outside the door.
 RIPED|boasting|I listened. I used your token, changed the report, gave them the route. Your note and a few radio cuts did the rest.
 CAL|disgust|You sold her out because she trusted me?
 RIPED|angry|Because you both made me nothing. She told you everything and I got the joke afterward.
 GREVYN|from beyond the field, lucid horror|I told him. Not you.
 RIPED|sudden fear|Grevyn. You were not supposed to—
 GREVYN|realizing|You let me hate him. You came here and did it again.
 RIPED|trying the old charm|Come on. I got you through it, did I not?
 CAL|urgent|Grevyn, look at me. You do not have to listen to him anymore.'''),
 scene('Lightning','Wide camera follows Grevyn rising 3 m, staying outside a 5 m electrical safety radius. Cold arcs circle her; reduced-flash mode uses continuous ribbons and bass tremor. She grabs Riped with the field and slams him once to the floor. Cut to Cal at contact; Riped dies instantly, no gore or ragdoll comedy.',
 '''GREVYN|rage, not a scream on every word|You knew. All that time. You knew.
 RIPED|terrified|Put me down. Grevyn, I can explain—
 CAL|calling|Grevyn! Stop!
 GREVYN|one sharp line|You do not get to explain me away.
 TAY|radio, urgent|Cal, stay clear of the field!
 CAL|after impact, shocked|Grevyn? Grevyn, look at me.
 ROAD|alarmed|The surge is leaving her. Clear the fall.
 CAL|moving, helpless|No. No, not from that high.'''),
 scene('A minute of her own','She loses consciousness and falls onto broken floor, severely injuring her torso and leg. Cal reaches her only after arcs cease. Tay enters from the cleared side with Sable\'s remote guidance. Use a 6-second floor-level follow of the stretcher team, then static faces. Do not let Cal catch her and erase the injury.',
 '''TAY|working|Do not lift her alone. Keep her head still. Cal, give me space at her side.
 CAL|frightened|She is breathing. Tell me she is breathing.
 TAY|clear|She is. That does not mean she is all right.
 GREVYN|waking, weak and herself|Cal? I heard him. I heard all of it.
 CAL|gentle, breath uneven|I am here.
 GREVYN|horrified|I killed him.
 CAL|not absolving or condemning in the crisis|We deal with that when you are safe. Right now, stay with Tay.
 GREVYN|ashamed, reaching for truth|I believed him. I said you left me.
 CAL|honest|It hurt. I still wanted you alive.
 GREVYN|small|I do not know how to be who you came for.
 CAL|soft|You do not have to be her to let us help.'''),
 scene('Not finished','A low continuous field tone rises; Grevyn recognizes its return before losing control. The force moves her injured body unnaturally, never healing it. Gameplay resumes in a clear cover position with nonlethal objectives. No further click dismisses the entire confrontation.',
 '''GREVYN|fearful warning|It is coming back. I can feel what it wants me to say.
 SABLE|radio|Start monitored support. Keep the field input away from the injured side.
 EVIL|through the room, distinct voice|You have broken a servant. You have not broken the order.
 GREVYN|straining against control|Cal, get back. Not because I want you gone. Get back.
 CAL|steadying|I hear you.
 EVIL|taking control|Return the subject to her station.
 TAY|urgent|Her injuries are still there. If it makes her stand, it is hurting her.
 CAL|resolved|Then we break its equipment. Not her.''')])

mission('M31','Break the Connection','Chapter 10 - The Passenger',60,'citadel','STORM_INTERIOR','BREAK',
 'Survive the controlled Grevyn\'s attack without attacking her; disable the local reinforcement relays.',
 [('Reach cover','Move Tay and the injured Grevyn\'s support equipment behind grounded screens.'),('Disable three relays','Use mechanical isolation at west, service and dais feeds while avoiding field sweeps.'),('Open extraction','Let Road Force guide a safe corridor after capacity cost or use the installed screens.')],
 ('relay_isolator','Follow the floor cable to the labelled isolation handle, not the medical line.'),
 'Physical Road Force shielding costs one reserve unit after warning; manual grounding preserves reserve. Neither requires shooting Grevyn.',
 'Attacks telegraph with steady light, tone and floor trace. Downing resets to the room checkpoint, never permanently injures allies or rerolls the ending.',[
 scene('Her warning matters','Gameplay starts behind grounded cover. A 4-second low follow along the floor cable shows the first isolator only after Grevyn\'s initial sweep stops. Cinematic does not take camera control while danger is active.',
 '''EVIL|through Grevyn\'s station|The witness will return to compliance.
 CAL|calling to her, not it|I heard you tell me to get back. I am listening this time.
 GREVYN|brief resistance, in pain|The floor. Do not cross the bright line.
 TAYJ|radio|Three reinforcement feeds. Medical support is separate. I marked the labels.
 TAY|behind cover|She cannot take many more forced movements. We need the stretcher route.
 CAL|focused|West feed first. Keep talking me through it.
 SABLE|radio|Nothing fired at her. Nothing through her support line.
 CAL|firm|Understood.'''),
 scene('The things around her','Player shuts down relays one at a time. Between safe windows, follow Cal from cover to handle for no more than 3 seconds if cinematic assistance is enabled; otherwise maintain gameplay camera. Grevyn\'s involuntary motion slows with each feed.',
 '''TAYJ|after first relay|One down. Field is narrowing, not gone.
 EVIL|cold|You were useful when you followed orders, Reed.
 CAL|angry clarity|That was the problem.
 GREVYN|lucid fragment|Do not let it make you prove something.
 CAL|hearing her|I will not.
 ROAD|offering, not acting|I can hold a shield for the crossing. One measure. The screens offer another path.
 TAY|clear|Both routes are open. Choose from cover.
 CAL|after third relay|Reinforcement off. Bring the stretcher.'''),
 scene('Out of the room','When threat pauses, a 6-second follow tracks Tay, Cal and the stretcher through the grounded corridor. No triumphant Grevyn standing animation. Her grip loosens and the field subsides, leaving her severely injured and conscious enough to consent to moving.',
 '''TAY|to Grevyn|My name is Tay. You know me from school. We need to move you with support. Is that all right?
 GREVYN|weak, herself|Yes. Do not let it stand me up again.
 CAL|quiet promise within his control|We will use the stretcher.
 TAYJ|radio|Service doors open. Dain is ready.
 GREVYN|to Cal|You stayed.
 CAL|honest|I am staying now. We can talk about then when we have a road under us.
 EVIL|distant threat|There is no road outside what I can reach.
 ROAD|quiet defiance|There are roads you did not build.''')])

mission('M32','The Passenger','Chapter 10 - The Passenger',60,'extraction','EVAC','PASSENGER',
 'Stabilize Grevyn, begin appropriate support and evacuate with ongoing consent where possible.',
 [('Prepare transport','Secure stretcher, injury supports, support monitor and spare power.'),('Explain the substitute','Tell Grevyn what Golghis does and what remains unknown; obtain consent in a lucid interval.'),('Leave the complex','Load the medical vehicle and depart along the prepared route.')],
 ('stretcher_mount','Both locking pins must show seated before the vehicle can move.'),
 'Verified Golghis starts planned support; provisional stock remains explicitly emergency-only. If she cannot respond, use the least restrictive stabilization until she can.',
 'No case opening under gunfire. Support consumables are abstract fictional units; no real dosing or medical instructions.',[
 scene('Ask her','Sheltered loading bay. Static eye-level framing between Tay and Grevyn; Cal remains visible without dominating the conversation. No camera angle makes an injured woman an exhibit. Sable explains through an identified radio channel.',
 '''SABLE|radio, clear|Grevyn, I have your corrected research. Golghis supports the damage without strengthening the bond.
 GREVYN|weak, assessing|Did you use the west-marked pages?
 TAY|direct|All three corrected checks. I can show you the verification record.
 GREVYN|PREPARED|Then yes. I want the support. I want it out of me.
 GREVYN|UNPREPARED|Do not call the provisional batch ready. I wrote the warning for a reason.
 CAL|to her|We have a recovery route. We can still finish it.
 GREVYN|quiet|Then do not let being close make you stop thinking.
 TAY|respectful|We will tell you before every next step.'''),
 scene('A place in the van','Follow the stretcher rails into the medical vehicle over 5 seconds, ending on a locking pin. Return control for both lock checks. Tay takes the treatment seat, Cal can drive the escort truck or ride briefly while Dain drives.',
 '''DAIN|checking|Rails seated. Rear power is independent. We can leave if the grid fails.
 TAY|to Cal|You check the second pin. I check her support.
 CAL|working|Second pin seated.
 GREVYN|trying to orient|Where are we going?
 CAL|honest|The place they first held the Road Force. We removed the locks. It has equipment that can guide the severing.
 GREVYN|frightened|Another facility.
 TAY|gentle, definite|With an exit we control. You can see it before anything starts.
 GREVYN|after a breath|Keep telling me where we are.'''),
 scene('Not fine','As vehicles idle safely, Grevyn calls Cal by his nickname; he names the anxiety without blaming her for using it. Camera stays steady. Their friendship is unresolved and neither promises immediate reconciliation.',
 '''GREVYN|quiet|Cal?
 CAL|breath catches|Give me a second. Hearing you say it brings the call back.
 GREVYN|guilt|I can stop.
 CAL|honest|For now, maybe use Callum. It is not a punishment.
 GREVYN|accepting|Callum. Thank you for telling me.
 CAL|soft|Thank you for asking.
 TAYJ|radio|Road clear. Scheduled check-in at the western marker.
 CAL|to crew|We move when Tay says she is secured.
 TAY|after check|Secured. Slow departure.''')])

mission('M33','The Longest Drive','Chapter 10 - The Passenger',60,'returnroad','STORM','LONG_DRIVE',
 'Bring Grevyn to the prepared site through pursuit, forced-memory anomalies and quiet intervals.',
 [('Clear the pursuit','Use prepared civilian diversion routes or disable pursuer vehicles without involving civilians.'),('Anchor the real road','Navigate field intrusions using TayJ\'s physical markers and vehicle telemetry.'),('Reach the first prison','Make a safe support stop and complete the final approach.')],
 ('ground_marker','The striped post is real; the repeated school doorway is a memory intrusion.'),
 'Drive escort, medical van or a split-convoy segment at different stages. Crew travel changes naturally, preserving player vehicle choice when practical.',
 'No endless chase requiring every vehicle killed. Authored break-contact conditions are distance plus disabled tracking feed; crashes are simulated safely away from civilians.',[
 scene('A road with company','Begin with a rear-left follow of the two vehicles only while safely stationary, then hand driving back before the first threat. Radio voices are clear over engines. Enemy collisions use existing vehicle simulation, not lethal cutscene rails through traffic.',
 '''TAYJ|radio|Two pursuit vehicles. Civilian turn is clear. Do not lead them through the crossing.
 DAIN|radio|I can block the service fork after you pass.
 CAL|focused|Keep the van moving. I will take the outside line.
 TAY|radio|Her support is holding. No hard turns if you can avoid them.
 GREVYN|radio, lucid fragment|They are following the tower signal. Not your tail lights.
 TAYJ|checking|She is right. Repeater on the ridge. We cut it and break sight.
 CAL|to Grevyn|Good catch.
 GREVYN|faint|I was paying attention too.'''),
 scene('The classroom in the road','Optional cinematic shows a school doorway reflected in the windshield, never replacing the physical road collider. Player retains steering. A brief safe-stop insert recalls the real striped marker. Reduced-effects setting uses subtitle and sound distortion instead of visual warping.',
 '''EVIL|intruding, calm|You can stop trying. There is a version where you never left that room.
 CAL|grounding himself|That room is not here. The marker is here.
 TAYJ|radio|Three close posts, one striped. Road bends right beyond the fourth.
 GREVYN|fighting the intrusion|It shows me things I want to believe. Do not argue with the picture. Follow the post.
 CAL|answering her|I hear you.
 TAY|radio|Both of you, breathe with the engine idle when we stop. No one has to win this in one breath.
 ROAD|weak, steady|I can hold the signal. The driving belongs to you.
 CAL|determined|That is enough.'''),
 scene('A quiet kilometer','After breaking contact, music loses percussion. Player may stop at a marked turnout without a biological countdown. Follow Cal walking from escort truck to van for 5 seconds, then return for a brief check-in. End at the containment-site gate.',
 '''CAL|at safe stop|I used to imagine finding you and having the right thing ready to say.
 GREVYN|exhausted|Was it better than this?
 CAL|a sad laugh|Usually I got as far as being angry. Then I ran out of words.
 GREVYN|honest|I am still angry. Not all of it knows where to go.
 CAL|accepting|We do not have to solve that before the next kilometer.
 TAY|checking monitor|That is a good plan for both of you.
 TAYJ|radio|Site gate ahead. Dain has the lights on.
 GREVYN|quiet|I can see the exit from here.''')])

mission('M34','Containment','Chapter 11 - What We Choose',60,'firstprison','CONTAINMENT','TERMS',
 'Give Grevyn the full truth, repair every known gap and obtain informed consent before final treatment.',
 [('Set the room','Position the medical platform, release wheel and monitors; test three reserve capacitors as needed.'),('Tell the truth','Explain Road Force\'s bargain, costs, all viable procedures and available recovery routes.'),('Choose readiness','Review the explicit checklist; freely leave to repair gaps before sealing the consent record.')],
 ('readiness_board','The board beside the release wheel lists exactly what remains missing.'),
 'All choices remain reversible here. Grevyn hears the Road Force\'s responsibility and may be angry while still consenting to treatment.',
 'Emergency risk is displayed as a design probability before selection. Full preparation is deterministic, never a hidden dice roll.',[
 scene('The room is yours to inspect','Follow Grevyn\'s stretcher at eye height through the site, 6 seconds, then show the reachable release wheel from her actual viewpoint. Cal remains outside her personal space until invited. Visible readiness board identifies each missing condition.',
 '''TAY|to Grevyn|Here is the release. Guidance stops, medical support stays on.
 GREVYN|checking|No locks?
 DAIN|from the doorway|Removed. I can show you the pile.
 SABLE|clear|We can delay. Nothing starts because the room is ready.
 CAL|gentle|There is something else you need to hear. The Road Force helped open contact with the thing controlling you.
 ROAD|plain to Grevyn|For my freedom. I discovered the experiments while they happened and failed to stop them.
 GREVYN|angry, lucid|You wanted out. So did I.
 ROAD|accepting|I know. What I wanted does not excuse what it cost you.'''),
 scene('No better words than the truth','Static full-crew conversation. Show the exact preparedness check after Sable\'s explanation. The emergency route is clearly marked 65% survival in this production design, subject to pre-release balance testing; no chance in the prepared route.',
 '''SABLE|PREPARED|Verified Golghis, stable support, working guidance and enough reserve. With these conditions met, the planned procedure does not depend on a survival lottery.
 SABLE|UNPREPARED|We have gaps. We can still repair them. The emergency attempt would give her a sixty-five percent chance of surviving the severing.
 GREVYN|UNPREPARED|Then show me what we can fix before you ask whether I will take that risk.
 TAYJ|shared|Every missing item has a marked recovery stop. No path has closed behind us.
 ROAD|shared|Transfer remains another possibility. It would kill Callum and consume me. It would not heal her injuries.
 GREVYN|shared, firm|Do not offer his life like an item on your bench.
 CAL|shared|Nobody is choosing it for me. I want us both to leave.
 TAY|shared|Then we take the time the safer plan needs.'''),
 scene('Consent is a conversation','Player may leave and return with repairs. On final confirmation Grevyn chooses severing without Cal selecting her answer for her; she has received all facts. Fatally transferring requires a separate later Cal confirmation, never this general consent.',
 '''GREVYN|after inspection, resolved|I want the connection gone. I understand what you can do and what you cannot promise.
 SABLE|respectful|And if you tell us stop before the severing, we stop.
 CAL|quiet|Is there anything you want before we begin?
 GREVYN|human, not ceremonial|Water. A quieter room. And no one telling me this makes everything worth it.
 TAY|gentle|Water I can do. Quiet too.
 TAYJ|to Cal|I am here. She is here. Read the board once more, then choose.
 CAL|grounded|I am reading it.
 ROAD|faint|For once, let the choice belong to the people living with it.''')])

mission('M35','The Severing','Chapter 11 - What We Choose',60,'firstprison','SEVERING','SEVERING',
 'Resolve the connection through prepared severing, a clearly risky emergency attempt or voluntary fatal transfer.',
 [('Confirm the route','Choose repair and return, prepared severing, disclosed emergency risk or a separately confirmed fatal transfer.'),('Run the procedure','Operate TayJ\'s guidance sequence while Tay and Sable maintain support.'),('Commit the outcome','Resolve once, persist result, consume the Road Force and continue to the appropriate aftermath.')],
 ('guidance_handle','The guidance control is the amber wheel; the medical support lever stays untouched.'),
 'Prepared route succeeds deterministically. Emergency uses one persisted 65% draw. Cal\'s fatal transfer saves Grevyn only with bodily support verified, so restore that first.',
 'Procedure input failure pauses or resets to its last safe phase without randomizing survival. Fatal outcome commits before cutscene; reload cannot reroll emergency result.',[
 scene('One more chance to change course','Static readiness screen with spoken confirmation. Hold to confirm for fatal transfer after an explicit cancelable summary; no time pressure or preselected sacrifice. Emergency random result is stored at irreversible start before any animation.',
 '''SABLE|PREPARED|Planned severing confirmed. Support stable. We proceed when Grevyn says.
 GREVYN|PREPARED|Proceed.
 SABLE|EMERGENCY|Emergency attempt. Sixty-five percent survival. We can still stop and repair the gaps now.
 GREVYN|EMERGENCY|I understand. If we do this, do not hide the result from him.
 CAL|TRANSFER|I am choosing the transfer. I understand I will die. Not because she owes me, and not because I think my life is worthless.
 TAY|TRANSFER, grief held steady|You are loved here, Cal. I need you to know that before you choose it again.
 CAL|TRANSFER|I know. I wish there were another way we were willing to take. I am choosing this one.
 GREVYN|TRANSFER, distressed|I do not want your death to be the proof you cared.
 CAL|TRANSFER, gentle|It never was. It is a choice. You do not owe me a life shaped around it.
 TAYJ|shared|Last opportunity to stop. The release is still in reach.'''),
 scene('Hold the line','Procedure gameplay uses three labelled guidance actions with no twitch requirement. Follow Cal from console to side rail for 4 seconds only during a safe phase. Grevyn stays supported. The Dominion appears as cold geometry pulling toward the ceiling; Road Force amber holds its edge, not a giant boss health bar.',
 '''TAYJ|measured|Guidance one. Field isolated from medical support.
 TAY|focused|Breathing supported. Injury support secure.
 EVIL|cold persuasion|I can give you a world that will never leave you again.
 GREVYN|lucid resistance|You gave me a room I could not leave. That is not the same thing.
 CAL|PREPARED or EMERGENCY|Follow her corrected pattern. West, not north.
 SABLE|checking|Corrected pattern stable. Continue when ready.
 ROAD|fading|It will offer you certainty. Keep the things you can check.
 TAYJ|steady|Guidance two. Guidance three. Holding.'''),
 scene('Both alive','Only PREPARED or EMERGENCY_SUCCESS. Amber field dissolves steadily into the road seams. Grevyn remains injured on the platform; no sudden walking recovery. Hold a quiet wide after the bond breaks, then faces. Road Force dies completing the severing.',
 '''ROAD|SURVIVE, very weak|The connection is gone. What happens next belongs to you.
 CAL|SURVIVE, shaken|Stay long enough to hear her answer.
 ROAD|SURVIVE|I cannot. Tell the truth about me. Not only the part that helped.
 GREVYN|SURVIVE, quiet|I will.
 TAY|SURVIVE, checking|She is breathing. Support steady. No field return.
 SABLE|SURVIVE|Do not move her yet. Survival is the start of treatment, not the end.
 CAL|SURVIVE, relief breaking through|Okay. We have a start.
 TAYJ|SURVIVE, emotional but clear|Recording the time. Recording that you are both here.'''),
 scene('The transfer','Only TRANSFER. With bodily support verified, Cal willingly receives the supernatural connection through the field rig. No real-world self-injury mechanism. Static two-shot across the platform, warm amber then darkness. Road Force destroys the transferred bond; Cal dies. Do not frame his death as punishment for depression.',
 '''ROAD|TRANSFER|Connection transferred. I can finish it here.
 CAL|TRANSFER, afraid but certain|I am scared. That does not change what I chose.
 GREVYN|TRANSFER, lucid grief|Callum. I am here. I hear you.
 CAL|TRANSFER|I know. Stay with them.
 TAY|TRANSFER, holding his hand|We have you, Cal. You are not alone.
 TAYJ|TRANSFER, voice failing once|I am keeping the whole record. All of you.
 ROAD|TRANSFER, final|No more bargains.
 SABLE|TRANSFER, after a long silence|The bond is gone. Grevyn\'s support is holding.
 TAY|TRANSFER, quiet grief|Cal is gone.'''),
 scene('The attempt that fails','Only EMERGENCY_FAILURE. The Road Force completes the severing but Grevyn does not survive the physiological collapse. Sable and Tay attempt care off the dramatic beat; a respectful time transition makes the medical outcome clear. No player button is blamed for the random result.',
 '''TAY|FAILURE, urgent|Support is falling. Sable, stay with me.
 SABLE|FAILURE, working|I am here. We are still treating her.
 CAL|FAILURE, frightened|Grevyn, can you hear me?
 ROAD|FAILURE, disappearing|The bond is broken. I cannot hold her body here.
 GREVYN|FAILURE, last lucid words|I know you came back.
 CAL|FAILURE, breaking|I wanted you to have more than knowing that.
 TAY|FAILURE, after treatment and time transition|Cal. We tried. She did not survive.
 SABLE|FAILURE, gentle clarity|The emergency risk was real. You did not cause this by missing a control.
 CAL|FAILURE, quiet|Please do not leave me alone yet.''')])

mission('M36','What Comes After','Chapter 11 - What We Choose',60,'home','AFTERMATH','AFTER',
 'Resolve all four endings, show Grandpa and the Dominion destroying each other, and establish aftermath without erasing losses.',
 [('Allow time','Play the medical recovery or grieving transition appropriate to the persisted outcome.'),('Speak honestly','If both survive, let Grevyn state her needs and choose Cal\'s response: together or separate.'),('Witness the wider ending','Show Grandpa\'s failed power grab, the Dominion\'s eventual death and the surviving communities.')],
 ('keepsake_box','The personal case is on the bedside table; open it only if you want the private recording.'),
 'Together is a platonic chosen future; separate is not failure. Death endings receive distinct aftermaths. Freeroam after Cal\'s death uses a labelled pre-finale save, never resurrection.',
 'Ending choice saves before credits. Grand finale never reverses a committed death or removes regime remnants from later play.',[
 scene('The man who wanted his state back','Audience-only cutscene after severing, explicitly intercut elsewhere. Grandpa escapes the broken reconstruction facility and reaches his field-control chamber. Follow him entering, 5 seconds; close view of a previously established emergency rupture control, then a wide of the confrontation.',
 '''GUCKI|furious|I gave you a population. A state. You will not leave me ruling ruins.
 EVIL|weakened, cold|You gave me fear. You called the arrangement leadership.
 GUCKI|bitter|Then I end the arrangement.
 EVIL|amused threat|You are inside it.
 GUCKI|activating the rupture|So are you.
 EVIL|sudden pain|You do not understand what you have broken.
 GUCKI|not redeemed, defiant|I understand enough.
 EVIL|killing him, failing|Then understand this.'''),
 scene('What a dying force leaves','The Dominion kills Grandpa through the field as his rupture rig fatally damages it. No instant victory heals Grevyn retroactively. A time-lapse of failing cold grid lines over several days establishes the force dying out. Surviving Trooper units abandon some posts and retain others.',
 '''TAYJ|SURVIVE or FAILURE, report days later|Reconstruction command is silent. Gucki is dead. The field keeps shrinking.
 SABLE|shared|The rupture damaged its source. It is dying, not traveling to another host.
 NESS|shared|Troopers still hold two junctions. We do not call those people free until they can leave.
 DAIN|shared|Then we keep the crossings open.
 MERRIN|supervised testimony|Put my orders in the record too. Do not clean the resistance out of this history.
 ORIN|shared|No one account gets to own what happened.
 GREVYN|SURVIVE or TRANSFER, later|Especially not his. He did not save me by killing the thing he fed.
 TAY|FAILURE, later|And its death does not make hers smaller.'''),
 scene('If both survive: the conversation','Weeks later, Grevyn in rehabilitation, Cal rested but still anxious. Static two-shot at a shaded roadside table with mobility support nearby. She may want connection without promising restored trust. Player sees together and separate as equal, explicit choices.',
 '''GREVYN|SURVIVE|I want a life that is not built around what they did. I do not know yet where that is.
 CAL|SURVIVE|I wanted finding you to explain the missing years. It did not give them back.
 GREVYN|SURVIVE|I still have things to answer for. Riped is dead because of what I did. Being controlled does not make every consequence disappear.
 CAL|SURVIVE|And I have service records to face that no forged report can explain away.
 GREVYN|SURVIVE|I would like to know you now. Slowly. I can do that nearby or from somewhere else.
 CAL|TOGETHER|I want to try nearby. As friends. With room to say when it is too much.
 CAL|SEPARATE|I want you alive in the world. I also need to build a life that is not waiting for your next call. We should leave separately.
 GREVYN|TOGETHER|Then slowly. No pretending the old seat was empty all this time.
 GREVYN|SEPARATE|All right. I can be sad about that and still respect it.
 CAL|SURVIVE|So can I.'''),
 scene('Together','Only TOGETHER. Months later, medical progress is modest and believable. Follow Cal and Grevyn walking a short distance to the crew vehicle; mobility aid remains as needed. TayJ calls from the relay, Tay packs for a clinic visit. No romantic kiss, coupling achievement or implied cure for Cal\'s mental health.',
 '''TAY|TOGETHER|Clinic first. Then the new road. I did not negotiate that order for entertainment.
 GREVYN|TOGETHER, dry humor returning|Is she always this persuasive?
 CAL|TOGETHER|Only when she is right. Terrible habit.
 TAYJ|TOGETHER, radio|Dispatch to people having conversations beside a running engine.
 DAIN|TOGETHER|Fuel does not get cheaper because the ending is nice.
 GREVYN|TOGETHER, asking carefully|Can I call you Cal today?
 CAL|TOGETHER, checking himself|Today, yes.
 GREVYN|TOGETHER, gentle|Save me a seat, Cal.
 CAL|TOGETHER|There is room. We can choose where we go.'''),
 scene('Separate','Only SEPARATE. At the crossing, Grevyn leaves with a rehabilitation convoy while Cal stays with his crew. Follow each departure in two equally lit shots, not a bleak-versus-golden moral contrast. A later letter confirms mutual voluntary contact.',
 '''GREVYN|SEPARATE|I am not disappearing this time. The relay address is on the back.
 CAL|SEPARATE|I will write when I have something true to say. Not because I think I have to keep you from vanishing.
 GREVYN|SEPARATE|That is a better promise.
 TAY|SEPARATE, later|How are you doing?
 CAL|SEPARATE, honest|Sad. Relieved. Hungry, apparently. More than one thing.
 TAYJ|SEPARATE|That sounds like a person, not a verdict.
 CAL|SEPARATE, a small laugh|You have been waiting to say that.
 TAYJ|SEPARATE|I wrote it down. Obviously.'''),
 scene('If Cal died','Only TRANSFER. Weeks later Grevyn joins Tay and TayJ at a private memorial, still in treatment. A static wide gives all three equal space. Her future includes accountability and friendship, not a romantic bereavement identity. Cal\'s private recordings are shared only according to his stated wishes.',
 '''GREVYN|TRANSFER, grief|I kept thinking I would find one sentence that made it less final.
 TAY|TRANSFER|I still reach for the radio to tell him things.
 TAYJ|TRANSFER|I saved his last message. I also saved the stupid argument about the kettle. He was more than the last message.
 GREVYN|TRANSFER|He told me not to shape my life around what he did.
 TAY|TRANSFER, gentle|You do not have to get that right all at once.
 GREVYN|TRANSFER|I want to help with the records. Then I want to learn what a day is when nobody is telling me who to be.
 TAYJ|TRANSFER|We can start with today.
 GREVYN|TRANSFER, quiet|He came back. I wish he could have left with us.'''),
 scene('If Grevyn died','Only FAILURE. Cal at a quiet community memorial; no solitary desert walk as a glamorous disappearance. Tay and TayJ stay nearby without speaking for him. Grevyn\'s work supports other survivors with attribution and privacy, not a cure-all.',
 '''CAL|FAILURE, grief|I found her. I keep saying it like the rest of the sentence might change.
 TAY|FAILURE|You can say her name without making the ending make sense.
 TAYJ|FAILURE|Her research is archived under her name. Not a subject number.
 CAL|FAILURE|She wanted to be more than what happened to her.
 SABLE|FAILURE|Then we record her jokes and her corrections too. And we ask before using her work for anyone else.
 CAL|FAILURE, to friends|Can we stay together tonight? I do not want the quiet yet.
 TAY|FAILURE|Yes. And tomorrow we find more help than just us.
 CAL|FAILURE, small resolve|Tomorrow. I can do that much.''')])

# Authored systemic speech. Trigger once per journey beat unless explicitly marked repeatable.
RUNTIME=[
 ('R01','Driving and crew contact','At safe stops; suppress during threats and story speech.',[
 ('CAL','tired honesty','TayJ, can we leave the channel open for a little while?'),
 ('TAYJ','steady','Yes. I am checking maps. You can hear paper instead of silence.'),
 ('CAL','after long separation','I have been putting off everything that is not keeping the truck moving.'),
 ('TAY','warm boundary','Then pick one small thing. Food first. Then ask Dain about the belt. You do not have to do the whole day at once.'),
 ('DAIN','dry','That rattle is not the apocalypse. It is the spare jack hitting the bed.'),
 ('CAL','relieved joke','Good. I am fully booked for apocalypses.'),
 ('RIPED','pre-M18 only, cocky','If you had followed my line, we would already be there.'),
 ('TAYJ','pre-M18 only, flat','Your line ended in a fence. I marked it for posterity.'),
 ('TAY','noticing fatigue','Next turnout. We swap drivers. No argument worth having at eighty kilometers an hour.'),
 ('CAL','accepting','All right. Next turnout.'),
 ('GREVYN','post-M32 only, weak','Tell me which town that is. I want the names, not just the distance.'),
 ('CAL','post-M32 only, gentle','Ness calls it the crossing. We can stop there when you are ready.')]),
 ('R02','Survival and mechanical events','Gameplay bark after event; 25-second category cooldown, no story spoilers.',[
 ('CAL','walking into loose barrel, annoyed','Sorry. Did not realize you owned the pavement.'),
 ('DAIN','ignition fails, diagnostic','Starter turns. Check fuel before you blame the battery.'),
 ('CAL','door jam, dry','Of course the door wants an opinion too.'),
 ('TAY','after collision, safe stop','Brake on. Everybody answer before anybody says the truck is fine.'),
 ('TAYJ','after collision, practical','I am here. Turn the engine off if you smell fuel.'),
 ('CAL','minor collision, rattled','I am here. We stop and check it.'),
 ('DAIN','repair complete','There. Listen to that. It sounds expensive in a healthier way.'),
 ('TAY','low supplies','We need a supply stop. Hunger is not a loyalty test.'),
 ('TAYJ','lost route','Stop at the marker. We orient from something real, not from how certain we feel.'),
 ('CAL','safe pull-over','Pulling over. Give me a minute before the next question.')]),
 ('R03','Evidence and object hints','Only after the corresponding objective is active and hint delay has elapsed.',[
 ('TAYJ','archive hint','Check the page behind the copy. The staple crosses both sheets.'),
 ('TAY','medical hint','The labelled support line stays live. We are isolating the field line.'),
 ('DAIN','cargo hint','Two straps. The one you cannot see from here still counts.'),
 ('CAL','school hint, remembering','She hid things behind the obvious answer.'),
 ('SABLE','formula hint','Read the corrections beside the failed draft. She left both for a reason.'),
 ('TAYJ','prison hint','Numbered cells on your right. Service signs point to the south exit.'),
 ('ROAD','reserve warning','I can do this, but it will reduce what remains. Look at your meter first.'),
 ('CAL','declining intervention','We use the tools. Keep what you have for her.'),
 ('GREVYN','final-site hint','The release has to work from this side too. Show me that first.'),
 ('SABLE','readiness hint','The missing check is on the board. We can still go back for it.')]),
 ('R04','Combat, access and interruption','No taunts about disability, identity or victims. Resume interrupted story at a safe boundary.',[
 ('VOSS','checkpoint challenge','Engine off. Hands visible. Leave the manifest on the dashboard.'),
 ('CAL','checkpoint answer','We are carrying clinic supplies. You can inspect the sealed manifest.'),
 ('VOSS','pursuit order','Keep the medical vehicle intact. Disable the escort.'),
 ('TAYJ','pursuit cue','Civilian road on the left. Keep the pursuit away from it.'),
 ('DAIN','escape cue','Service fork clear. Pass me, then I close the barrier.'),
 ('CAL','nonlethal objective reminder','The relays. We shut down the relays, not her support.'),
 ('GREVYN','brief resistance','Move behind the screen. I cannot hold this still.'),
 ('TAY','injury reminder','Do not make her stand. The field is not healing her.'),
 ('ROAD','interrupted scene','You need the road first. We can speak when it is safe.'),
 ('TAYJ','resumption','We stopped at the second timestamp. Ready to pick it up?')])
]
for rid,title,stage,rows in RUNTIME:
 for j,row in enumerate(rows):
  assert row[0] in CAST
