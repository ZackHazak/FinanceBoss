-- Enable Write Access for Fitness Targets
create policy "Allow public insert fitness_targets" on fitness_targets for insert with check (true);
create policy "Allow public update fitness_targets" on fitness_targets for update using (true);
create policy "Allow public delete fitness_targets" on fitness_targets for delete using (true);
